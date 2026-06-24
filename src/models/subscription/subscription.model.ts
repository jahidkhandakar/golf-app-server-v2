import { Schema, model } from "mongoose";
import { ISubscription } from "./subscription.interface";

const subscriptionSchema = new Schema<ISubscription>(
  {
    subscribUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subscriptionType: {
      type: String,
      enum: ["basicUser", "superUser"],
      required: true,
    },

    stripeSubscriptionId: {
      type: String,
      required: true,
    },

    stripeCustomerId: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "canceled"],
      default: "active",
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
    },

    planPrice: {
      type: Number,
      required: true,
    },

    planType: {
      type: String,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["credit_card", "paypal"],
      required: true,
    },

    lastPaymentDate: {
      type: Date,
    },

    reminderSent: {
      type: Boolean,
      default: false,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Subscription = model<ISubscription>(
  "Subscription",
  subscriptionSchema,
);

export default Subscription;
