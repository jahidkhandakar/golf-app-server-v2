import { Schema, model } from "mongoose";
import { ITournamentUser } from "./tournament.users.interface";

const tournamentUserSchema: Schema<ITournamentUser> = new Schema(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "standby", "no-show"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const TournamentUser = model<ITournamentUser>(
  "TournamentUser",
  tournamentUserSchema,
);
