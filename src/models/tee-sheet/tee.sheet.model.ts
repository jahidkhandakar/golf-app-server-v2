import { Schema, model } from "mongoose";
import { IPlayer, ITeeSheet } from "./tee.sheet.interface";

const playerSchema = new Schema<IPlayer>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    handicap: {
      type: Number,
    },

    isShowChallenge: {
      type: Boolean,
      default: false,
    },

    challengeUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false },
);

const teeSheetSchema = new Schema<ITeeSheet>(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },

    groupNumber: {
      type: Number,
      required: true,
    },

    groupName: {
      type: String,
      required: true,
    },

    players: {
      type: [playerSchema],
      default: [],
    },

    maxPlayers: {
      type: Number,
      default: 4,
    },

    teeDate: {
      type: Date,
      required: true,
    },

    teeTime: {
      type: Date,
      required: true,
    },

    teeInterval: {
      type: Number,
      default: 10,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const TeeSheet = model<ITeeSheet>("TeeSheet", teeSheetSchema);
