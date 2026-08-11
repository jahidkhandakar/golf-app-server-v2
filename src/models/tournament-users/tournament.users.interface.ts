import { Document, Types } from "mongoose";

export interface ITournamentUser extends Document {
  tournament: Types.ObjectId;
  user: Types.ObjectId;
  // standby: on the FIFO waitlist (spec §3). no-show: marked absent, scorecard
  // voided, slot opened (spec §8).
  status: "pending" | "accepted" | "rejected" | "standby" | "no-show";
  createdAt: Date;
  updatedAt: Date;
}
