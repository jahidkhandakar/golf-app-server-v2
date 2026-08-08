import { StatusCodes } from "http-status-codes";
import AppError from "../errors/AppError";
import { isClubStaff } from "../models/club-users/club.users.service";

/**
 * Staff gate for a tournament: its creator, or a creator/sub-admin of its club.
 * Throws 403 otherwise. Used by score entry, KP management, cancel-round, etc.
 */
export const assertTournamentStaff = async (
  tournament: { tournamentCreator?: unknown; club?: unknown },
  userId: string,
): Promise<void> => {
  if (tournament.tournamentCreator?.toString() === userId) return;
  if (
    tournament.club &&
    (await isClubStaff(tournament.club as string, userId))
  ) {
    return;
  }
  throw new AppError(
    StatusCodes.FORBIDDEN,
    "Only the tournament creator or a club sub-admin can do this",
  );
};
