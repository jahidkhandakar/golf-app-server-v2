import { Schema, model } from "mongoose";
import {} from "mongoose";
import { ITeeSheetGroup } from "./teesheet.group.interface";

const teeSheetGroupSchema: Schema<ITeeSheetGroup> = new Schema(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },

    groupName: {
      type: String,
      required: true,
    },

    groupIndex: {
      type: Number,
      required: true,
    },

    players: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    maxPlayers: {
      type: Number,
      default: 5,
    },

    teeTime: {
      type: Date,
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// prevent duplicate groups per tournament
teeSheetGroupSchema.index({ tournament: 1, groupName: 1 }, { unique: true });

export const TeeSheetGroup = model<ITeeSheetGroup>(
  "TeeSheetGroup",
  teeSheetGroupSchema,
);
