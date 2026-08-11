import { Document, Types } from "mongoose";

export interface IClub extends Document {
  name?: string;

  createdBy: Types.ObjectId;

  clubLogo: Record<string, any>;

  location: {
    type: "Point";
    coordinates: number[];
  };

  description?: string;

  maxPlayers?: number;

  isDeleted: boolean;

  /** Private clubs are invisible in discovery/search/feed/nearby and never feed
   *  the zone Top 50. Conversion is one-way: private → public only. (spec §12) */
  isPrivate: boolean;

  /** Private-club billing (spec §12): the per-member fee the creator is charged
   *  when minting a slot, and the creator's Stripe customer + saved payment
   *  method to charge. Amount is in the currency's minor unit (cents). */
  perMemberFee?: number;
  perMemberCurrency?: string;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;

  city?: string;

  totalPlayers: number;

  createdAt: Date;
  updatedAt: Date;
}
