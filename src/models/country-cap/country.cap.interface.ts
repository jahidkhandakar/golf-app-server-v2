import { Document } from "mongoose";

/**
 * Per-country cap on side-game payouts (spec §2). When an event's total payout
 * exceeds the applicable cap, dollar amounts are hidden entirely regardless of
 * the showAmounts toggle. Editable by an admin without a code deploy.
 *
 * The special code "GLOBAL" is the fallback baseline used when a tournament's
 * country has no specific row.
 */
export interface ICountryCap extends Document {
  /** ISO 3166-1 alpha-2 country code, or "GLOBAL" for the baseline. */
  countryCode: string;
  capAmount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}
