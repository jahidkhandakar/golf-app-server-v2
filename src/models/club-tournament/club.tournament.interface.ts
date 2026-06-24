import { Types } from "mongoose";

export interface IClubTournament {
  club: Types.ObjectId;
  clubCreator: Types.ObjectId;
  tournament: Types.ObjectId;
  status: "active" | "inactive";
}
