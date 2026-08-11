import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { ChallengeMatch } from "./challenge.match.model";
import { formatDateTime } from "../../utils/formatDateTime";
import { User } from "../user/user.model";
import { TeeSheet } from "../tee-sheet/tee.sheet.model";
import { Tournament } from "../tournament/tournament.model";
import { ClubLadderService } from "../club-users/club.ladder.service";
import { TournamentResult } from "../tournament-result/tournament.result.model";
import { assertTournamentStaff } from "../../shared/tournamentStaff";
import { resolveChallengeByScore } from "../../shared/engine/rulings";

const createChallengeMatch = async (
  payload: any,
  teeSheetId: string,
  userId: string,
) => {
  const { tournamentId, player1Id, player2Id } = payload;

  if (player1Id === player2Id) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Players must be different");
  }

  // console.log("tournamentId", tournamentId, "teeSheetId", teeSheetId);

  const group = await TeeSheet.findById(teeSheetId).populate(
    "players.user",
    "name handicap",
  );

  if (!group) {
    throw new AppError(StatusCodes.NOT_FOUND, "Group not found");
  }

  // ensure tournament match
  if (group.tournament.toString() !== tournamentId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Group does not belong to this tournament",
    );
  }

  const groupName = group.groupName;

  // =========================
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  if (!tournament.tournamentCreator.equals(userId)) {
    throw new AppError(StatusCodes.FORBIDDEN, "Not authorized");
  }

  const exists = await ChallengeMatch.findOne({
    tournament: tournamentId,
    groupName,
    "player1.user": player1Id,
    "player2.user": player2Id,
    isDeleted: false,
  });

  if (exists) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Match already exists");
  }

  const p1 = group.players.find(
    (p: any) => p.user._id.toString() === player1Id,
  );

  const p2 = group.players.find(
    (p: any) => p.user._id.toString() === player2Id,
  );

  if (!p1 || !p2) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Players must be in same group",
    );
  }

  if (p1.isShowChallenge || p2.isShowChallenge) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "One or both players already in challenge",
    );
  }

  // Enforce the club leaderboard scaling rules (spec §9): both players must be
  // ranked and within the challenge range. Only applies to club tournaments
  // with an active ladder; skipped when the club has no active leaderboard.
  if (tournament.club) {
    const check = await ClubLadderService.validateChallenge(
      tournament.club.toString(),
      player1Id,
      player2Id,
    );
    if (!check.allowed) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        check.reason ?? "Challenge not allowed under the leaderboard rules",
      );
    }
  }

  const lastMatch = await ChallengeMatch.findOne({
    tournament: tournamentId,
    groupName,
    $or: [
      {
        "player1.user": player1Id,
        "player2.user": player2Id,
      },
      {
        "player1.user": player2Id,
        "player2.user": player1Id,
      },
    ],
  }).sort({ round: -1 });

  console.log("lastMatch", lastMatch);

  const nextRound = lastMatch ? lastMatch.round + 1 : 1;

  console.log("nextRound", nextRound);

  const match = await ChallengeMatch.create({
    tournament: tournamentId,
    groupName,
    round: nextRound,
    player1: {
      user: (p1!.user as any)._id,
      handicap: Number(p1!.handicap ?? (p1!.user as any).handicap ?? 0),
    },
    player2: {
      user: (p2!.user as any)._id,
      handicap: Number(p2!.handicap ?? (p2!.user as any).handicap ?? 0),
    },
    teeTime: group.teeTime,
    location: tournament.courseName || tournament.city,
  });

  await TeeSheet.updateOne(
    { _id: teeSheetId, "players.user": player1Id },
    {
      $set: {
        "players.$.isShowChallenge": true,
        "players.$.challengeUser": player2Id,
      },
    },
  );

  await TeeSheet.updateOne(
    { _id: teeSheetId, "players.user": player2Id },
    {
      $set: {
        "players.$.isShowChallenge": true,
        "players.$.challengeUser": player1Id,
      },
    },
  );

  return match;
};

const getChallengeMatches = async (
  tournamentId: string,
  groupName?: string,
) => {
  console.log("tournamentId", tournamentId, groupName);

  const filter: any = { tournament: tournamentId, isDeleted: false };
  if (groupName) {
    filter.groupName = { $regex: groupName, $options: "i" };
  }
  const matches = await ChallengeMatch.find(filter)
    .populate("player1.user", "name _id image email ")
    .populate("player2.user", "name _id image email ");

  // console.log(matches);

  return matches.map((m: any) => {
    const formatted = formatDateTime(m.teeTime as any);
    // console.log("formatted", m.teeTime);
    return {
      _id: m._id,
      player1: {
        _id: m.player1.user._id,
        name: m.player1.user.name,
        email: m.player1.user.email,
        image: m.player1.user.image,
        handicap: m.player1.handicap,
      },
      player2: {
        _id: m.player2.user._id,
        name: m.player2.user.name,
        email: m.player2.user.email,
        image: m.player2.user.image,
        handicap: m.player2.handicap,
      },
      status: m.status,
      location: m.location,
      date: formatted.date,
      time: formatted.time,
    };
  });
};

const updateChallengeMatches = async (
  userId: string,
  tournamentId: string,
  matchId: string,
) => {
  const findUser = await User.findById(userId);

  if (!findUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const findTournament = await Tournament.findOne({
    _id: tournamentId,
    tournamentCreator: userId,
  });

  if (!findTournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  if (findTournament.status === "completed") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Tournament already completed, can't update",
    );
  }

  const matches = await ChallengeMatch.find({ tournament: tournamentId });

  if (!matches || matches.length === 0) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "No matches found for this tournament",
    );
  }

  const findChallengeMatch = await ChallengeMatch.findById(matchId);

  if (!findChallengeMatch) {
    throw new AppError(StatusCodes.NOT_FOUND, "Challenge match not found");
  }

  if (findChallengeMatch.status === "completed") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Challenge match already completed, can't update",
    );
  }

  findChallengeMatch.status = "completed";

  await findChallengeMatch.save();

  return findChallengeMatch;

  // findTournament.status = "completed";
  // await findTournament.save();
};

const completeTournament = async (userId: string, tournamentId: string) => {
  const findUser = await User.findById(userId);

  if (!findUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const findTournament = await Tournament.findOne({
    _id: tournamentId,
    tournamentCreator: userId,
  });

  if (!findTournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  if (findTournament.status === "completed") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Tournament already completed, can't update",
    );
  }

  findTournament.status = "completed";
  await findTournament.save();

  return findTournament;
};

/**
 * Resolve a challenge from the submitted scorecards (spec §11): the ladder
 * moves when scores determine the winner, NOT when the challenge is sent. Lower
 * gross wins; an exact tie is a push (no movement, no penalty — spec §10). A
 * decisive result moves the club ladder (winner takes loser's slot).
 */
const resolveChallengeMatch = async (userId: string, matchId: string) => {
  const match = await ChallengeMatch.findById(matchId);
  if (!match || match.isDeleted) {
    throw new AppError(StatusCodes.NOT_FOUND, "Challenge match not found");
  }
  if (["completed", "pushed", "void"].includes(match.status)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This challenge is already resolved",
    );
  }

  const tournament = await Tournament.findById(match.tournament);
  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }
  await assertTournamentStaff(tournament, userId);

  // Winner comes from the scorecards — require both to be in.
  const result = await TournamentResult.findOne({
    tournament: match.tournament,
  });
  const p1Id = match.player1.user.toString();
  const p2Id = match.player2.user.toString();
  const p1Score = result?.playerScores.find(
    (s: any) => s.user?.toString() === p1Id,
  );
  const p2Score = result?.playerScores.find(
    (s: any) => s.user?.toString() === p2Id,
  );
  if (!p1Score?.score || !p2Score?.score) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Both players' scorecards must be submitted before resolving",
    );
  }

  const outcome = resolveChallengeByScore(p1Score.score, p2Score.score);

  if (outcome === "push") {
    match.status = "pushed";
    match.winner = undefined;
    await match.save();
    return match;
  }

  const winnerId = outcome === "p1" ? p1Id : p2Id;
  const loserId = outcome === "p1" ? p2Id : p1Id;
  match.winner = outcome === "p1" ? match.player1.user : match.player2.user;
  match.status = "completed";
  await match.save();

  // Move the club ladder off the scorecard result.
  if (tournament.club) {
    await ClubLadderService.applyChallengeResult(
      tournament.club.toString(),
      winnerId,
      loserId,
    );
  }

  return match;
};

const deleteChallengeMatch = async (matchId: string, userId: string) => {
  const match = await ChallengeMatch.findById(matchId);

  if (!match) {
    throw new AppError(StatusCodes.NOT_FOUND, "Challenge match not found");
  }

  const tournament = await Tournament.findById(match.tournament);

  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  if (!tournament.tournamentCreator.equals(userId)) {
    throw new AppError(StatusCodes.FORBIDDEN, "Not authorized");
  }

  // SOFT DELETE
  match.isDeleted = true;
  match.deletedAt = new Date();

  await match.save();

  // RESET PLAYER CHALLENGE STATUS
  await TeeSheet.updateMany(
    {
      tournament: match.tournament,
      groupName: match.groupName,
      "players.user": {
        $in: [match.player1.user, match.player2.user],
      },
    },
    {
      $set: {
        "players.$[elem].isShowChallenge": false,
        "players.$[elem].challengeUser": null,
      },
    },
    {
      arrayFilters: [
        {
          "elem.user": {
            $in: [match.player1.user, match.player2.user],
          },
        },
      ],
    },
  );

  return match;
};

export const ChallengeMatchService = {
  getChallengeMatches,
  createChallengeMatch,
  updateChallengeMatches,
  resolveChallengeMatch,
  completeTournament,
  deleteChallengeMatch,
};
