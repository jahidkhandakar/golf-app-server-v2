import { Schema, model } from "mongoose";
import { IChallengeMatch, IPlayer } from "./challenge.match.interface";

const PlayerSchema = new Schema<IPlayer>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    handicap: {
      type: Number,
    },
  },
  { _id: false },
);

const ChallengeMatchSchema = new Schema<IChallengeMatch>(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },

    groupName: {
      type: String,
      required: true,
      trim: true,
    },

    player1: {
      type: PlayerSchema,
      required: true,
    },

    player2: {
      type: PlayerSchema,
      required: true,
    },

    round: {
      type: Number,
      default: 1,
    },

    winner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    teeTime: {
      type: Date,
      required: true,
    },

    location: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      // pushed: exact-tie challenge, no movement, no penalty (spec §10).
      // void: cancelled with the round, no penalty (spec §10 cancel-round).
      enum: ["pending", "playing", "completed", "pushed", "void"],
      default: "pending",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

export const ChallengeMatch = model<IChallengeMatch>(
  "ChallengeMatch",
  ChallengeMatchSchema,
);
