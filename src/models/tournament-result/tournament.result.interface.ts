import { Document, Types } from "mongoose";

export interface ISkins {
  user?: Types.ObjectId;
  hole?: number;
  score?: string;
  amount?: number;
  isPaid?: boolean;
}

export interface IKps {
  user?: Types.ObjectId;
  hole?: number;
  feet?: number;
}

export interface IChallengeMatchResult {
  winner?: Types.ObjectId;
  loser?: Types.ObjectId;
  winnerRound?: number;
  loserRound?: number;
}

export interface IPlayerScore {
  user?: Types.ObjectId;
  teeBox?: string;
  /** Total gross (sum of holes when entered by-hole). */
  score?: number;
  /** Per-hole strokes, index 0 = hole 1, 0 = not entered. Required for the
   *  skins/KP engine to compute winners. */
  holes?: number[];
}

export interface ITournamentResult extends Document {
  tournament: Types.ObjectId;
  skins: ISkins[];
  kps: IKps[];
  challengeMatches: IChallengeMatchResult[];
  playerScores: IPlayerScore[];
  createdAt: Date;
  updatedAt: Date;
}
