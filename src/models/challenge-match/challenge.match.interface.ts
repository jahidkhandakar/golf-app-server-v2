import { Types } from "mongoose";

type ChallengeMatchStatus =
  "pending" | "playing" | "completed" | "pushed" | "void";

export interface IChallengeMatch {
  tournament: Types.ObjectId;
  groupName: string;

  player1: IPlayer;
  player2: IPlayer;

  round: number;

  winner?: Types.ObjectId;

  teeTime: Date;

  location?: string;

  status: ChallengeMatchStatus;

  isDeleted: boolean;

  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPlayer {
  user: Types.ObjectId;
  handicap?: number;
}
