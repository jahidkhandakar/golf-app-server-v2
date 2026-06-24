import { Schema, model } from "mongoose";
import { ISponserTournament } from "./sponsored.tournament.interface";

const sponserTournamentSchema = new Schema<ISponserTournament>(
  {
    sponserCreator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    sponserImage: {
      type: Object,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },

      coordinates: {
        type: [Number],
        required: true,
        default: [0, 0],
      },
    },

    link: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

sponserTournamentSchema.index({ location: "2dsphere" });

export const SponserTournament = model<ISponserTournament>(
  "SponserTournament",
  sponserTournamentSchema,
);
