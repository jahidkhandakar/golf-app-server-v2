import { Document, Types } from "mongoose";

export interface ITeeSheetGroup extends Document {
  tournament: Types.ObjectId;
  groupName: string;
  groupIndex: number;
  players: Types.ObjectId[];
  maxPlayers: number;
  teeTime: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
