import { Schema, model } from "mongoose";
import { IKpPin, IKpEntry } from "./kp.live.interface";

const kpPinSchema = new Schema<IKpPin>(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    hole: { type: Number, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: { type: [Number], required: true },
    },
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// One pin per tournament+hole; geo index for range queries.
kpPinSchema.index({ tournament: 1, hole: 1 }, { unique: true });
kpPinSchema.index({ location: "2dsphere" });

const kpEntrySchema = new Schema<IKpEntry>(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    hole: { type: Number, required: true },
    category: {
      type: String,
      enum: ["open", "men", "seniorMen", "women", "seniorWomen"],
      default: "open",
    },
    isLongDrive: { type: Boolean, default: false },
    player: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    measurer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    distance: { type: Number, required: true },
    photos: { type: [String], default: [] },
    isLeader: { type: Boolean, default: false },
    dethronedAt: { type: Date },
  },
  { timestamps: true },
);

kpEntrySchema.index({ tournament: 1, hole: 1, category: 1, isLongDrive: 1 });

export const KpPin = model<IKpPin>("KpPin", kpPinSchema);
export const KpEntry = model<IKpEntry>("KpEntry", kpEntrySchema);
