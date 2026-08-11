import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { Tournament } from "./tournament.model";
import { TournamentUser } from "../tournament-users/tournament.users.model";
import { TeeSheetGroup } from "../tee-sheet-group/teesheet.group.model";
import { TournamentResult } from "../tournament-result/tournament.result.model";
import { ChallengeMatch } from "../challenge-match/challenge.match.model";
import { User } from "../user/user.model";
import { assertTournamentStaff } from "../../shared/tournamentStaff";
import { sendNotification } from "../../notifications/notification.service";

const loadOpenTournament = async (tournamentId: string) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }
  if (tournament.status === "completed" || tournament.status === "cancelled") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This tournament is closed to roster changes",
    );
  }
  return tournament;
};

/**
 * Join the standby waitlist (spec §3). FIFO by join time. A free user's travel
 * trial is NOT consumed here — only on promotion. Returns the caller's 1-based
 * position in the queue.
 */
export const joinStandby = async (tournamentId: string, userId: string) => {
  await loadOpenTournament(tournamentId);

  const existing = await TournamentUser.findOne({
    tournament: tournamentId,
    user: userId,
  });
  if (existing?.status === "accepted") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You are already in the roster",
    );
  }

  let entry = existing;
  if (entry && entry.status === "standby") {
    // already waiting — just report position
  } else if (entry) {
    entry.status = "standby";
    await entry.save();
  } else {
    entry = await TournamentUser.create({
      tournament: tournamentId,
      user: userId,
      status: "standby",
    });
  }

  // FIFO position: standby entries created at or before this one.
  const position = await TournamentUser.countDocuments({
    tournament: tournamentId,
    status: "standby",
    createdAt: { $lte: entry!.createdAt },
  });

  return { position };
};

/**
 * Staff promotes a standby player into the roster (spec §3). Bypasses the
 * 48-hour lock (staff action). Fills an open tee-sheet slot (e.g. one opened by
 * a no-show), notifies the player, and consumes a free user's travel trial.
 * The promoted player inherits nothing — no challenges, side-game entries, or
 * pairing preferences from whoever they replace.
 */
export const promoteFromStandby = async (
  tournamentId: string,
  staffUserId: string,
  targetUserId: string,
) => {
  const tournament = await loadOpenTournament(tournamentId);
  await assertTournamentStaff(tournament, staffUserId);

  const entry = await TournamentUser.findOne({
    tournament: tournamentId,
    user: targetUserId,
    status: "standby",
  });
  if (!entry) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "That player is not on the standby list",
    );
  }

  entry.status = "accepted";
  await entry.save();

  // Register them on the tournament roster list.
  await Tournament.updateOne(
    { _id: tournamentId },
    { $addToSet: { tournamentPlayersList: targetUserId } },
  );

  // Fill an open tee-sheet slot (e.g. a no-show's), if any.
  const openGroup = await TeeSheetGroup.findOne({
    tournament: tournamentId,
    $expr: { $lt: [{ $size: "$players" }, "$maxPlayers"] },
  }).sort({ groupIndex: 1 });
  let assignedGroup: number | null = null;
  if (openGroup) {
    await TeeSheetGroup.updateOne(
      { _id: openGroup._id },
      { $addToSet: { players: targetUserId } },
    );
    assignedGroup = openGroup.groupIndex;
  }

  // Consume a free user's travel trial (paid users / superusers are exempt).
  const user = await User.findById(targetUserId);
  let travelTrialConsumed = false;
  if (
    user &&
    !user.isSubscribe &&
    !user.isAprovedAsSupperUser &&
    (user.travelTrialsRemaining ?? 0) > 0
  ) {
    user.travelTrialsRemaining = (user.travelTrialsRemaining ?? 0) - 1;
    await user.save();
    travelTrialConsumed = true;
  }

  await sendNotification({
    sender: staffUserId,
    receiver: targetUserId,
    title: "You're in!",
    body: `You've been promoted from standby into "${tournament.tournamentName ?? tournament.courseName}".`,
    type: "general",
    linkId: `/tournaments/${tournamentId}`,
  });

  return { promoted: true, assignedGroup, travelTrialConsumed };
};

/**
 * Staff marks a player a no-show (spec §8): voids their scorecard, opens their
 * tee-sheet slot for standby promotion, and byes any active challenge — the
 * opponent advances with no rank penalty and the challenge is voided. A no-show
 * after the 48-hour lock is the only way a slot opens post-lock.
 */
export const markNoShow = async (
  tournamentId: string,
  staffUserId: string,
  targetUserId: string,
) => {
  const tournament = await loadOpenTournament(tournamentId);
  await assertTournamentStaff(tournament, staffUserId);

  const entry = await TournamentUser.findOne({
    tournament: tournamentId,
    user: targetUserId,
  });
  if (!entry || entry.status !== "accepted") {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "That player is not an accepted entrant",
    );
  }
  entry.status = "no-show";
  await entry.save();

  // Void their scorecard: remove their per-hole scores so no engine counts them.
  await TournamentResult.updateOne(
    { tournament: tournamentId },
    { $pull: { playerScores: { user: targetUserId } } },
  );

  // Open their tee-sheet slot and drop them from the active roster list.
  await TeeSheetGroup.updateMany(
    { tournament: tournamentId },
    { $pull: { players: targetUserId } },
  );
  await Tournament.updateOne(
    { _id: tournamentId },
    { $pull: { tournamentPlayersList: targetUserId } },
  );

  // Challenge bye: any active challenge involving them is voided, the opponent
  // advances without penalty and is notified.
  const challenges = await ChallengeMatch.find({
    tournament: tournamentId,
    isDeleted: false,
    status: { $in: ["pending", "playing"] },
    $or: [{ "player1.user": targetUserId }, { "player2.user": targetUserId }],
  });

  let byesAwarded = 0;
  for (const match of challenges) {
    const opponentId =
      match.player1.user.toString() === targetUserId
        ? match.player2.user
        : match.player1.user;
    match.winner = opponentId; // bye
    match.status = "void"; // no rank penalty, challenge voided
    await match.save();
    byesAwarded += 1;
    await sendNotification({
      sender: staffUserId,
      receiver: opponentId.toString(),
      title: "You advance on a bye",
      body: `Your challenge opponent was a no-show in "${tournament.tournamentName ?? tournament.courseName}". You advance with no penalty.`,
      type: "general",
      linkId: `/tournaments/${tournamentId}`,
    });
  }

  return { noShow: true, byesAwarded };
};

export const RosterService = {
  joinStandby,
  promoteFromStandby,
  markNoShow,
};
