import { model, Schema } from "mongoose";
import { INotification } from "./notification.interface";

const notificationSchema = new Schema<INotification>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: false,
    },

    isRequest: {
      type: Boolean,
      default: false,
    },

    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: false,
    },

    title: {
      type: String,
      required: true,
    },

    body: {
      type: String,
      required: true,
    },

    linkId: {
      type: String,
      required: false,
    },

    type: {
      type: String,
      enum: ["payment", "general", "tournament", "update", "subscription"],
      default: "general",
    },

    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Notification = model<INotification>(
  "Notification",
  notificationSchema,
);
