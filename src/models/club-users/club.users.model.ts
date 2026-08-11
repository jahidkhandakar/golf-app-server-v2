import { model, Schema } from "mongoose";
import { IClubUser } from "./club.users.interface";

const clubUserSchema = new Schema<IClubUser>(
  {
    club: {
      type: Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },

    role: {
      type: String,
      enum: ["member", "subAdmin"],
      default: "member",
    },

    displayName: {
      type: String,
    },

    leaderboardOptedIn: {
      type: Boolean,
      default: false,
    },

    leaderboardPosition: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const ClubUser = model<IClubUser>("ClubUser", clubUserSchema);
