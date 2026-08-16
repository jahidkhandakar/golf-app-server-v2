import { StatusCodes } from "http-status-codes";
import { randomBytes } from "crypto";
import AppError from "../../errors/AppError";
import {
  DiscountCode,
  DiscountRedemption,
  DiscountRail,
} from "./discount.model";
import { User } from "../user/user.model";
import { writeAudit } from "../admin-audit/admin.audit.model";
import { createCoupon } from "../../utils/stripe";

const genCode = (prefix: string): string => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const body = Array.from(randomBytes(8))
    .map((b) => chars[b % chars.length])
    .join("");
  return `${prefix}-${body}`;
};

/** Extend a comp entitlement by N months from the later of now / existing end. */
const extendComp = (
  existing: Date | null | undefined,
  months: number,
): Date => {
  const base =
    existing && existing.getTime() > Date.now() ? existing : new Date();
  const end = new Date(base);
  end.setMonth(end.getMonth() + months);
  return end;
};

/** Comp code: 100% off for N months, email-bound, single-use (spec §16). */
export const mintComp = async (
  adminId: string,
  payload: { email: string; freeMonths: number; label?: string },
) => {
  if (!payload.email || !payload.freeMonths) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "email and freeMonths are required",
    );
  }
  const code = await DiscountCode.create({
    code: genCode("COMP"),
    type: "comp",
    rail: "app",
    freeMonths: payload.freeMonths,
    boundEmail: payload.email.toLowerCase(),
    singleUse: true,
    label: payload.label,
    createdBy: adminId,
  });
  await writeAudit({
    actingAdmin: adminId,
    action: "discount.comp.mint",
    targetType: "DiscountCode",
    targetId: String(code._id),
    metadata: { email: payload.email, freeMonths: payload.freeMonths },
  });
  return code;
};

/**
 * Campaign code: % off the first N months, multi-use with a cap and expiry. For
 * Stripe-billed items, mints a Stripe coupon and records its id (spec §16).
 */
export const mintCampaign = async (
  adminId: string,
  payload: {
    percentOff: number;
    firstNMonths?: number;
    maxRedemptions?: number;
    expiresAt?: string;
    rail?: DiscountRail;
    label?: string;
  },
) => {
  if (!payload.percentOff) {
    throw new AppError(StatusCodes.BAD_REQUEST, "percentOff is required");
  }
  const rail: DiscountRail = payload.rail ?? "app";
  const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;

  let stripeCouponId: string | null = null;
  if (rail === "stripe") {
    const coupon = await createCoupon({
      percentOff: payload.percentOff,
      duration: payload.firstNMonths ? "repeating" : "once",
      durationInMonths: payload.firstNMonths,
      maxRedemptions: payload.maxRedemptions,
      redeemBy: expiresAt ?? undefined,
      name: payload.label,
    });
    stripeCouponId = coupon.id;
  }

  const code = await DiscountCode.create({
    code: genCode("CAMP"),
    type: "campaign",
    rail,
    percentOff: payload.percentOff,
    firstNMonths: payload.firstNMonths,
    maxRedemptions: payload.maxRedemptions ?? null,
    expiresAt,
    stripeCouponId,
    label: payload.label,
    createdBy: adminId,
  });
  await writeAudit({
    actingAdmin: adminId,
    action: "discount.campaign.mint",
    targetType: "DiscountCode",
    targetId: String(code._id),
    metadata: { percentOff: payload.percentOff, rail },
  });
  return code;
};

/**
 * Import a store-generated code (Apple Offer / Google Play promo) for tracking
 * in the one discount dashboard (spec §16). The store owns redemption; we track.
 */
export const importStoreCode = async (
  adminId: string,
  payload: {
    code: string;
    rail: "store-apple" | "store-google";
    percentOff?: number;
    freeMonths?: number;
    label?: string;
    maxRedemptions?: number;
    expiresAt?: string;
  },
) => {
  const code = await DiscountCode.create({
    code: payload.code.toUpperCase(),
    type: "campaign",
    rail: payload.rail,
    percentOff: payload.percentOff,
    freeMonths: payload.freeMonths,
    maxRedemptions: payload.maxRedemptions ?? null,
    expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
    label: payload.label,
    createdBy: adminId,
  });
  await writeAudit({
    actingAdmin: adminId,
    action: "discount.store.import",
    targetType: "DiscountCode",
    targetId: String(code._id),
    metadata: { rail: payload.rail },
  });
  return code;
};

/**
 * Earned code: issued automatically by the social-post verification flow — the
 * user posts publicly and pastes the link, the backend verifies, and a code
 * lands in their account (no admin labor). Verification is stubbed to a
 * non-empty URL until the social integrations are wired.
 */
export const issueEarned = async (
  userId: string,
  payload: { postUrl: string; freeMonths?: number },
) => {
  if (!payload.postUrl?.startsWith("http")) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "A valid public post URL is required",
    );
  }
  // TODO: real post verification against the social platform.
  const freeMonths = payload.freeMonths ?? 1;
  const code = await DiscountCode.create({
    code: genCode("EARN"),
    type: "earned",
    rail: "app",
    freeMonths,
    singleUse: true,
    createdBy: userId,
  });
  // Earned codes auto-apply to the earner's account.
  await redeem(userId, code.code);
  return code;
};

/** Redeem an app-rail code (comp/earned/app campaign) for the current user. */
export const redeem = async (userId: string, rawCode: string) => {
  const code = await DiscountCode.findOne({
    code: rawCode.trim().toUpperCase(),
    active: true,
  });
  if (!code) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Unknown or inactive code");
  }
  if (code.expiresAt && code.expiresAt.getTime() < Date.now()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "This code has expired");
  }
  if (
    code.maxRedemptions != null &&
    code.redemptionCount >= code.maxRedemptions
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, "This code is fully redeemed");
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  if (code.boundEmail && code.boundEmail !== user.email?.toLowerCase()) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "This code is bound to a different account",
    );
  }

  // One redemption per user; also enforces comp single-use atomically.
  try {
    await DiscountRedemption.create({ code: code._id, user: userId });
  } catch {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You have already redeemed this code",
    );
  }

  code.redemptionCount += 1;
  if (code.singleUse) code.active = false;
  await code.save();

  // Comp / earned free months apply as an entitlement.
  if (code.freeMonths && code.freeMonths > 0) {
    user.compFreeUntil = extendComp(user.compFreeUntil, code.freeMonths);
    await user.save();
  }

  return {
    applied: true,
    type: code.type,
    freeMonths: code.freeMonths ?? 0,
    percentOff: code.percentOff ?? 0,
    compFreeUntil: user.compFreeUntil,
  };
};

/** Recovery tool (spec §16): grant free months directly, in lieu of a refund. */
export const grantComp = async (
  adminId: string,
  userId: string,
  months: number,
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  user.compFreeUntil = extendComp(user.compFreeUntil, months);
  await user.save();
  await writeAudit({
    actingAdmin: adminId,
    action: "discount.comp.grant",
    targetType: "User",
    targetId: userId,
    metadata: { months },
  });
  return { compFreeUntil: user.compFreeUntil };
};

/** Revoke a code (spec §16). */
export const revokeCode = async (adminId: string, id: string) => {
  const code = await DiscountCode.findByIdAndUpdate(
    id,
    { active: false },
    { new: true },
  );
  if (!code) throw new AppError(StatusCodes.NOT_FOUND, "Code not found");
  await writeAudit({
    actingAdmin: adminId,
    action: "discount.revoke",
    targetType: "DiscountCode",
    targetId: id,
  });
  return code;
};

/** The one discount dashboard feed: all codes across both rails. */
export const listCodes = async () =>
  DiscountCode.find().sort({ createdAt: -1 });

export const DiscountService = {
  mintComp,
  mintCampaign,
  importStoreCode,
  issueEarned,
  redeem,
  grantComp,
  revokeCode,
  listCodes,
};
