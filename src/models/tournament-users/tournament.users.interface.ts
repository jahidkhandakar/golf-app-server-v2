import { Document, Types } from "mongoose";

export interface ITournamentUser extends Document {
  tournament: Types.ObjectId;
  user: Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}
