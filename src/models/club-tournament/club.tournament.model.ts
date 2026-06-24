import { Schema, model } from "mongoose";
import { IClubTournament } from "./club.tournament.interface";

const clubTournamentSchema = new Schema<IClubTournament>(
  {
    club: {
      type: Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    clubCreator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tournament: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

export const ClubTournament = model<IClubTournament>(
  "ClubTournament",
  clubTournamentSchema,
);
