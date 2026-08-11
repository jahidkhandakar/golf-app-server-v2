import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { Club } from "./club.model";
import { ClubUser } from "../club-users/club.users.model";
import { User } from "../user/user.model";

/**
 * Convert a private club to public (spec §12). Creator only, one-way: a public
 * club can never be made private.
 */
export const convertToPublic = async (clubId: string, userId: string) => {
  const club = await Club.findById(clubId);
  if (!club) {
    throw new AppError(StatusCodes.NOT_FOUND, "Club not found");
  }
  if (club.createdBy.toString() !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Only the club creator can convert the club",
    );
  }
  if (!club.isPrivate) {
    throw new AppError(StatusCodes.BAD_REQUEST, "This club is already public");
  }
  club.isPrivate = false;
  await club.save();
  return { isPrivate: false };
};

/**
 * Resolve the name to show for a member. Inside a private club the club-scoped
 * alias (ClubUser.displayName) is used; everywhere else — and for all public
 * clubs — the account name is used (spec §12).
 */
export const resolveMemberName = async (
  clubId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
): Promise<string> => {
  const club = await Club.findById(clubId).select("isPrivate");
  if (club?.isPrivate) {
    const membership = await ClubUser.findOne({
      club: clubId,
      user: userId,
    }).select("displayName");
    if (membership?.displayName) return membership.displayName;
  }
  const user = await User.findById(userId).select("name");
  return user?.name ?? "Member";
};

export const PrivateClubService = {
  convertToPublic,
  resolveMemberName,
};
