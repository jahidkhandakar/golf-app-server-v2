import { Types } from "mongoose";

export interface IPlayer {
  user?: Types.ObjectId;
  handicap?: number;
  isShowChallenge: boolean;
  challengeUser?: Types.ObjectId;
}

export interface ITeeSheet {
  tournament: Types.ObjectId;
  groupNumber: number;
  groupName: string;
  players: IPlayer[];
  maxPlayers: number;
  teeDate: Date;
  teeTime: Date;
  teeInterval: number;
  createdBy: Types.ObjectId;
}
