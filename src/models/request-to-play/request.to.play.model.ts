import { model, Schema } from "mongoose";
import { IRequestToPlay } from "./request.to.play.interface";

const requestToPlaySchema = new Schema<IRequestToPlay>(
  {
    requestedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    challengedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    tournamentcreator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tournament: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: false,
    },

    requestType: {
      type: String,
      enum: ["challenge", "open"],
      default: "open",
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    tournamentType: {
      type: String,
      required: true,
    },
    isOnlyRequestToJoin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const RequestToPlay = model<IRequestToPlay>(
  "RequestToPlay",
  requestToPlaySchema,
);
