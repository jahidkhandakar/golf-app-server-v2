import { Document, Schema, Types, model } from "mongoose";

/**
 * A discount code (spec §16). Three types on top of the free-trial system:
 *   comp     — 100% off for N months, admin-minted, single-use, bound to an
 *              email so it can't circulate (VIPs, courted creators, recovery).
 *   campaign — % off the first N months, multi-use with a redemption cap and an
 *              expiry, for launch pushes.
 *   earned   — auto-issued by the social-post verification flow, no admin labor.
 *
 * Billing rails: consumer subscriptions bill through Apple/Google, so those
 * codes are Apple Offer / Google Play promo codes generated in the store
 * consoles and IMPORTED here for tracking (rail "store-apple"/"store-google").
 * Stripe-billed items (private-club slots, sponsored banners) take minted Stripe
 * coupons (rail "stripe", with stripeCouponId). App-level entitlements (comp,
 * earned free months) use rail "app".
 */
export type DiscountType = "comp" | "campaign" | "earned";
export type DiscountRail = "app" | "stripe" | "store-apple" | "store-google";

export interface IDiscountCode extends Document {
  code: string;
  type: DiscountType;
  rail: DiscountRail;

  percentOff?: number; // campaign / stripe
  freeMonths?: number; // comp / earned (100% off N months)
  firstNMonths?: number; // campaign: discount applies to first N months

  boundEmail?: string | null; // comp: bound so it can't circulate
  singleUse: boolean;
  maxRedemptions?: number | null; // campaign cap; null = unlimited
  redemptionCount: number;
  expiresAt?: Date | null;

  stripeCouponId?: string | null; // rail "stripe"
  label?: string; // campaign name / grouping
  active: boolean;
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const discountCodeSchema = new Schema<IDiscountCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    type: {
      type: String,
      enum: ["comp", "campaign", "earned"],
      required: true,
    },
    rail: {
      type: String,
      enum: ["app", "stripe", "store-apple", "store-google"],
      default: "app",
    },
    percentOff: { type: Number, min: 0, max: 100 },
    freeMonths: { type: Number, min: 0 },
    firstNMonths: { type: Number, min: 0 },
    boundEmail: { type: String, default: null, lowercase: true },
    singleUse: { type: Boolean, default: false },
    maxRedemptions: { type: Number, default: null },
    redemptionCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    stripeCouponId: { type: String, default: null },
    label: { type: String },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const DiscountCode = model<IDiscountCode>(
  "DiscountCode",
  discountCodeSchema,
);

/** Records who redeemed which code and when (feeds redemption reporting). */
export interface IDiscountRedemption extends Document {
  code: Types.ObjectId;
  user: Types.ObjectId;
  createdAt: Date;
}

const discountRedemptionSchema = new Schema<IDiscountRedemption>(
  {
    code: { type: Schema.Types.ObjectId, ref: "DiscountCode", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
discountRedemptionSchema.index({ code: 1, user: 1 }, { unique: true });

export const DiscountRedemption = model<IDiscountRedemption>(
  "DiscountRedemption",
  discountRedemptionSchema,
);
