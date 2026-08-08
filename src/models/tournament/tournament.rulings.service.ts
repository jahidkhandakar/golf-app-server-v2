import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { Tournament } from "./tournament.model";
import { ChallengeMatch } from "../challenge-match/challenge.match.model";
import { assertTournamentStaff } from "../../shared/tournamentStaff";
import { sendNotification } from "../../notifications/notification.service";

/**
 * Staff Cancel Round (spec §10): everything is voided and no engines fire. All
 * active challenges for the tournament are voided without penalty, and every
 * player is notified. The cancelled status is the void signal — no results are
 * computed or paid for a cancelled tournament.
 */
export const cancelRound = async (
  tournamentId: string,
  userId: string,
  reason?: string,
) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }
  await assertTournamentStaff(tournament, userId);

  if (tournament.status === "cancelled") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This tournament is already cancelled",
    );
  }

  tournament.status = "cancelled";
  await tournament.save();

  // Void active challenges without penalty (no winner, no ladder movement).
  await ChallengeMatch.updateMany(
    {
      tournament: tournamentId,
      status: { $in: ["pending", "playing"] },
      isDeleted: false,
    },
    { $set: { status: "void", winner: null } },
  );

  // Notify every registered player.
  const players = tournament.tournamentPlayersList ?? [];
  const body = reason
    ? `The round "${tournament.tournamentName ?? tournament.courseName}" was cancelled: ${reason}. No results or challenges count.`
    : `The round "${tournament.tournamentName ?? tournament.courseName}" was cancelled. No results or challenges count.`;

  await Promise.all(
    players.map((playerId) =>
      sendNotification({
        sender: userId,
        receiver: playerId.toString(),
        title: "Round cancelled",
        body,
        type: "general",
        linkId: `/tournaments/${tournamentId}`,
      }),
    ),
  );

  return { cancelled: true, notified: players.length };
};

export const TournamentRulingsService = {
  cancelRound,
};
