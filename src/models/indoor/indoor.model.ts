import { Document, Schema, Types, model } from "mongoose";

/**
 * Indoor golf domain (spec §13). A separate world from outdoor: separate
 * collections, a separate per-player indoor handicap, and NO references into
 * outdoor clubs, rounds, or the Top 50. Nothing here attaches to outdoor
 * records — enforced by keeping every ref within the indoor collections + User.
 */

export type WitnessStatus = "pending" | "verified" | "failed" | "overridden";

// ── League ────────────────────────────────────────────────────────────────
export interface IIndoorLeague extends Document {
  name: string;
  facilityName: string;
  facilityTimezone: string; // weeks run Mon 00:00–Sun 23:59 in this tz
  createdBy: Types.ObjectId;
  sims: number;
  hoursPerSim: number;
  allowExtraPerSim: boolean;
  entryFeeNote: string; // display-only; the app never collects money
  totalRounds: number; // default 10
  startDate: Date;
  midSeasonPrizes: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const indoorLeagueSchema = new Schema<IIndoorLeague>(
  {
    name: { type: String, required: true },
    facilityName: { type: String, required: true },
    facilityTimezone: { type: String, default: "UTC" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sims: { type: Number, required: true, min: 1 },
    hoursPerSim: { type: Number, required: true, min: 1 },
    allowExtraPerSim: { type: Boolean, default: false },
    entryFeeNote: { type: String, default: "" },
    totalRounds: { type: Number, default: 10 },
    startDate: { type: Date, required: true },
    midSeasonPrizes: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const IndoorLeague = model<IIndoorLeague>(
  "IndoorLeague",
  indoorLeagueSchema,
);

// ── League member (flight allocation + standings) ───────────────────────────
export interface IIndoorLeagueMember extends Document {
  league: Types.ObjectId;
  player: Types.ObjectId;
  indoorHandicap?: number | null; // established at 3 rounds
  roundsPlayed: number;
  flight?: number | null;
  flightOrder?: number | null;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

const indoorLeagueMemberSchema = new Schema<IIndoorLeagueMember>(
  {
    league: {
      type: Schema.Types.ObjectId,
      ref: "IndoorLeague",
      required: true,
    },
    player: { type: Schema.Types.ObjectId, ref: "User", required: true },
    indoorHandicap: { type: Number, default: null },
    roundsPlayed: { type: Number, default: 0 },
    flight: { type: Number, default: null },
    flightOrder: { type: Number, default: null },
    points: { type: Number, default: 0 },
  },
  { timestamps: true },
);
indoorLeagueMemberSchema.index({ league: 1, player: 1 }, { unique: true });

export const IndoorLeagueMember = model<IIndoorLeagueMember>(
  "IndoorLeagueMember",
  indoorLeagueMemberSchema,
);

// ── League round ────────────────────────────────────────────────────────────
export interface IIndoorRound extends Document {
  league: Types.ObjectId;
  player: Types.ObjectId;
  weekNumber: number;
  gross: number;
  courseRating: number;
  slopeRating: number;
  witnessPlayer?: Types.ObjectId | null;
  witnessStatus: WitnessStatus;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const indoorRoundSchema = new Schema<IIndoorRound>(
  {
    league: {
      type: Schema.Types.ObjectId,
      ref: "IndoorLeague",
      required: true,
    },
    player: { type: Schema.Types.ObjectId, ref: "User", required: true },
    weekNumber: { type: Number, required: true },
    gross: { type: Number, required: true },
    courseRating: { type: Number, required: true },
    slopeRating: { type: Number, required: true },
    witnessPlayer: { type: Schema.Types.ObjectId, ref: "User", default: null },
    witnessStatus: {
      type: String,
      enum: ["pending", "verified", "failed", "overridden"],
      default: "pending",
    },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
indoorRoundSchema.index({ league: 1, player: 1, weekNumber: 1 });

export const IndoorRound = model<IIndoorRound>(
  "IndoorRound",
  indoorRoundSchema,
);

// ── Sim session (sim board + Sim Social Rounds) ─────────────────────────────
/** A discrete proximity check result. Only pass/fail + timestamp are stored —
 *  never coordinates or movement history (spec §13). */
export interface IProximityCheck {
  kind: "check-in" | "mid-session" | "close";
  player: Types.ObjectId;
  passed: boolean;
  at: Date;
}

export interface IIndoorSession extends Document {
  league?: Types.ObjectId | null; // null for a one-time Sim Social Round
  title: string;
  isSocialRound: boolean;
  createdBy: Types.ObjectId;
  sims: number;
  hoursPerSim: number;
  allowExtraPerSim: boolean;
  // pinned sim location for proximity checks; stored to compare, never exposed
  location?: { type: "Point"; coordinates: number[] };
  roster: Types.ObjectId[];
  bays: { bayIndex: number; players: Types.ObjectId[] }[];
  checks: IProximityCheck[];
  createdAt: Date;
  updatedAt: Date;
}

const indoorSessionSchema = new Schema<IIndoorSession>(
  {
    league: { type: Schema.Types.ObjectId, ref: "IndoorLeague", default: null },
    title: { type: String, required: true },
    isSocialRound: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sims: { type: Number, required: true, min: 1 },
    hoursPerSim: { type: Number, required: true, min: 1 },
    allowExtraPerSim: { type: Boolean, default: false },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    roster: [{ type: Schema.Types.ObjectId, ref: "User" }],
    bays: [
      {
        _id: false,
        bayIndex: { type: Number, required: true },
        players: [{ type: Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    checks: [
      {
        _id: false,
        kind: { type: String, enum: ["check-in", "mid-session", "close"] },
        player: { type: Schema.Types.ObjectId, ref: "User" },
        passed: Boolean,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export const IndoorSession = model<IIndoorSession>(
  "IndoorSession",
  indoorSessionSchema,
);
