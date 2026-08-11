import { Schema, model } from "mongoose";
import { IClub } from "./club.interface";

const clubSchema: Schema<IClub> = new Schema(
  {
    name: {
      type: String,
      required: false,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    clubLogo: {
      type: Object,
      required: [true, "Image is must be Required"],
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },

      coordinates: {
        type: [Number],
        required: true,
        default: [0, 0],
      },
    },

    description: {
      type: String,
    },

    maxPlayers: {
      type: Number,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },

    perMemberFee: {
      type: Number,
    },
    perMemberCurrency: {
      type: String,
      default: "USD",
    },
    stripeCustomerId: {
      type: String,
    },
    stripePaymentMethodId: {
      type: String,
    },

    city: {
      type: String,
    },

    totalPlayers: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Geo index
clubSchema.index({ location: "2dsphere" });

export const Club = model<IClub>("Club", clubSchema);
