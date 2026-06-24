import { Schema, model } from "mongoose";
import { ISubscribe } from "./subscribe.interface";

const subscribeSchema = new Schema<ISubscribe>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    subscribeType: {
      type: String,
      enum: ["basicUser", "superUser"],
      required: true,
      unique: true,
    },

    price: {
      type: Number,
      required: true,
    },

    features: [
      {
        type: String,
      },
    ],

    typeOfSubscription: {
      type: String,
      enum: ["month", "year"],
    },
  },
  {
    timestamps: true,
  },
);

export const Subscribe = model<ISubscribe>("Subscribe", subscribeSchema);

export default Subscribe;
