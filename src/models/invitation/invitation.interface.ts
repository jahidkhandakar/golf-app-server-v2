import { Document, Types } from "mongoose";

export interface IInvitation extends Document {
  sender?: Types.ObjectId;
  receiver?: Types.ObjectId;
  tournament?: Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}
