import { StatusCodes } from "http-status-codes";
import { randomBytes } from "crypto";
import AppError from "../../errors/AppError";
import { Club } from "../club/club.model";
import { MemberSlot } from "./member.slot.model";
import { ClubUser } from "../club-users/club.users.model";
import { assertClubStaff } from "../club-users/club.users.service";
import { chargeOffSession } from "../../utils/stripe";

/** Generate a GGW-XXXX-XXXX code from an unambiguous alphabet. */
const generateCode = (): string => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const pick = (n: number) =>
    Array.from(randomBytes(n))
      .map((b) => chars[b % chars.length])
      .join("");
  return `GGW-${pick(4)}-${pick(4)}`;
};

/**
 * Creator / sub-admin mints a member slot (spec §12). Charges the per-member
 * fee on the club's saved Stripe payment method FIRST; only on success is the
 * one-time access code generated and the slot stored. Payment first, code
 * second.
 */
export const createSlot = async (
  clubId: string,
  actingUserId: string,
  payload: { displayName: string },
) => {
  const club = await Club.findById(clubId);
  if (!club) {
    throw new AppError(StatusCodes.NOT_FOUND, "Club not found");
  }
  if (!club.isPrivate) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Member slots exist only for private clubs",
    );
  }
  await assertClubStaff(clubId, actingUserId);

  if (!payload.displayName?.trim()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "displayName is required");
  }
  if (
    !club.perMemberFee ||
    !club.stripeCustomerId ||
    !club.stripePaymentMethodId
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Private-club billing is not set up (per-member fee and a saved payment method are required)",
    );
  }

  // Payment first.
  const charge = await chargeOffSession({
    customerId: club.stripeCustomerId,
    paymentMethodId: club.stripePaymentMethodId,
    amount: club.perMemberFee,
    currency: club.perMemberCurrency ?? "USD",
    description: `Private club member slot: ${club.name ?? clubId}`,
    metadata: { clubId: String(clubId), kind: "member-slot" },
  });

  // Code second — retry on the rare unique-code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const slot = await MemberSlot.create({
        club: clubId,
        displayName: payload.displayName.trim(),
        accessCode: generateCode(),
        stripePaymentId: charge.id,
      });
      return { code: slot.accessCode, slot };
    } catch (err: any) {
      if (err?.code === 11000) continue; // duplicate code, retry
      throw err;
    }
  }
  throw new AppError(
    StatusCodes.INTERNAL_SERVER_ERROR,
    "Could not generate a unique access code",
  );
};

/** Slots for a club (creator/sub-admin view), redeemed status included. */
export const listSlots = async (clubId: string, actingUserId: string) => {
  await assertClubStaff(clubId, actingUserId);
  return MemberSlot.find({ club: clubId }).sort({ createdAt: -1 });
};

/**
 * Redeem an access code (spec §12). One-shot and atomic: the findOneAndUpdate
 * flips redeemed only if it was still false, so two devices racing the same
 * code cannot both bind. Creates the club membership with the slot's alias.
 */
export const joinPrivate = async (
  userId: string,
  payload: { code: string; displayName?: string },
) => {
  const code = payload.code?.trim().toUpperCase();
  if (!code) {
    throw new AppError(StatusCodes.BAD_REQUEST, "An access code is required");
  }

  const slot = await MemberSlot.findOneAndUpdate(
    { accessCode: code, redeemed: false },
    { redeemed: true, redeemedBy: userId },
    { new: true },
  );
  if (!slot) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "That code is unknown or already used",
    );
  }

  // Bind membership with the club-scoped alias (member may override once).
  const alias = payload.displayName?.trim() || slot.displayName;
  await ClubUser.findOneAndUpdate(
    { club: slot.club, user: userId },
    {
      club: slot.club,
      user: userId,
      status: "accepted",
      displayName: alias,
    },
    { upsert: true, new: true },
  );
  await Club.updateOne({ _id: slot.club }, { $inc: { totalPlayers: 1 } });

  return { clubId: slot.club, displayName: alias };
};

export const MemberSlotService = {
  createSlot,
  listSlots,
  joinPrivate,
};
