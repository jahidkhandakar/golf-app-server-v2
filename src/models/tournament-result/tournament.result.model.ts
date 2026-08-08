import { Schema, model } from "mongoose";
import {
  IChallengeMatchResult,
  IKps,
  IPlayerScore,
  ISkins,
  ITournamentResult,
} from "./tournament.result.interface";

const skinsSchema = new Schema<ISkins>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  hole: Number,
  score: String,
  amount: Number,
  isPaid: {
    type: Boolean,
    default: false,
  },
});

const kpsSchema = new Schema<IKps>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  hole: Number,
  feet: Number,
});

const challengeMatchResultSchema = new Schema<IChallengeMatchResult>({
  winner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  loser: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  winnerRound: Number,
  loserRound: Number,
});

const playerScoreSchema = new Schema<IPlayerScore>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  teeBox: String,
  score: Number,
  holes: { type: [Number], default: undefined },
});

const tournamentResultSchema: Schema<ITournamentResult> = new Schema(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      unique: true,
    },

    skins: [skinsSchema],
    kps: [kpsSchema],
    challengeMatches: [challengeMatchResultSchema],
    playerScores: [playerScoreSchema],
  },
  { timestamps: true },
);

export const TournamentResult = model<ITournamentResult>(
  "TournamentResult",
  tournamentResultSchema,
);
