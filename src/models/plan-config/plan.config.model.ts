import { Document, Schema, model } from "mongoose";

/**
 * Subscription tier + price config (spec §16). One row per paid tier, with the
 * store price-tier mapping so the same plan can be reconciled against Apple /
 * Google price tiers. Editable by an admin without a code deploy.
 */
export interface IPlanConfig extends Document {
  tier: "basicUser" | "superUser";
  price: number;
  currency: string;
  interval: "month" | "year";
  applePriceTier?: string;
  googlePriceTier?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planConfigSchema = new Schema<IPlanConfig>(
  {
    tier: {
      type: String,
      enum: ["basicUser", "superUser"],
      required: true,
      unique: true,
    },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", uppercase: true },
    interval: { type: String, enum: ["month", "year"], default: "month" },
    applePriceTier: { type: String },
    googlePriceTier: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const PlanConfig = model<IPlanConfig>("PlanConfig", planConfigSchema);

/** Default tiers the config ships with; tuned by an admin afterward. */
export const DEFAULT_PLANS: {
  tier: "basicUser" | "superUser";
  price: number;
  currency: string;
  interval: "month" | "year";
}[] = [
  { tier: "basicUser", price: 0, currency: "USD", interval: "month" },
  { tier: "superUser", price: 0, currency: "USD", interval: "month" },
];
