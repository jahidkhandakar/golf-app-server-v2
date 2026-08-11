import { Document, Schema, Types, model } from "mongoose";

/**
 * A private-club member slot (spec §12). The creator pays the per-member fee,
 * which mints a one-time access code; a member redeems it to bind their account
 * to the slot. The code is generated only after the Stripe charge succeeds.
 */
export interface IMemberSlot extends Document {
  club: Types.ObjectId;
  displayName: string;
  accessCode: string;
  redeemed: boolean;
  redeemedBy?: Types.ObjectId | null;
  stripePaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const memberSlotSchema = new Schema<IMemberSlot>(
  {
    club: { type: Schema.Types.ObjectId, ref: "Club", required: true },
    displayName: { type: String, required: true },
    accessCode: { type: String, required: true, unique: true },
    redeemed: { type: Boolean, default: false },
    redeemedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    stripePaymentId: { type: String },
  },
  { timestamps: true },
);

export const MemberSlot = model<IMemberSlot>("MemberSlot", memberSlotSchema);
