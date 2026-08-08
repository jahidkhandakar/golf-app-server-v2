import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { Club } from "../club/club.model";
import { ClubUser } from "./club.users.model";
import { ResolvedClubRole } from "./club.users.interface";

/**
 * Resolve a user's role *within a specific club*, mirroring the frontend's
 * roleIn(): creator > subAdmin > member > nonMember.
 *
 * The creator is whoever owns Club.createdBy. Everyone else's standing comes
 * from an accepted ClubUser row and its role. Pending/rejected membership
 * counts as nonMember.
 */
export const resolveClubRole = async (
  clubId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
): Promise<ResolvedClubRole> => {
  const club = await Club.findById(clubId).select("createdBy");
  if (!club) {
    throw new AppError(StatusCodes.NOT_FOUND, "Club not found");
  }

  if (club.createdBy.toString() === userId.toString()) {
    return "creator";
  }

  const membership = await ClubUser.findOne({
    club: clubId,
    user: userId,
    status: "accepted",
  }).select("role");

  if (!membership) return "nonMember";
  return membership.role === "subAdmin" ? "subAdmin" : "member";
};

/** True for the creator or a sub-admin — the club-scoped "staff" powers. */
export const isClubStaff = async (
  clubId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
): Promise<boolean> => {
  const role = await resolveClubRole(clubId, userId);
  return role === "creator" || role === "subAdmin";
};

/** Throw 403 unless the user is club staff. Use to gate score entry,
 *  side-game toggles, private member-slot management, etc. */
export const assertClubStaff = async (
  clubId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
): Promise<void> => {
  if (!(await isClubStaff(clubId, userId))) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Only the club creator or a sub-admin can perform this action",
    );
  }
};

/**
 * Creator-only: promote an accepted member to sub-admin or demote back to
 * member. The creator role itself is fixed to Club.createdBy and cannot be
 * assigned here.
 */
export const setClubSubAdmin = async (
  clubId: string,
  actingUserId: string,
  targetUserId: string,
  makeSubAdmin: boolean,
) => {
  const club = await Club.findById(clubId).select("createdBy");
  if (!club) {
    throw new AppError(StatusCodes.NOT_FOUND, "Club not found");
  }
  if (club.createdBy.toString() !== actingUserId.toString()) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Only the club creator can change sub-admins",
    );
  }
  if (club.createdBy.toString() === targetUserId.toString()) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "The creator's role cannot be changed",
    );
  }

  const membership = await ClubUser.findOne({
    club: clubId,
    user: targetUserId,
    status: "accepted",
  });
  if (!membership) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "That user is not an accepted member of this club",
    );
  }

  membership.role = makeSubAdmin ? "subAdmin" : "member";
  await membership.save();
  return membership;
};

export const ClubUsersService = {
  resolveClubRole,
  isClubStaff,
  assertClubStaff,
  setClubSubAdmin,
};
