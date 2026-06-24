import { Types } from "mongoose";

export interface ICourseLocation {
  type: "Point";
  coordinates: [number, number];
}

export interface ITournament {
  club?: Types.ObjectId;
  tournamentCreator: Types.ObjectId;
  tournamentPlayersList: Types.ObjectId[];

  tournamentName?: string;
  tournamentType: string;

  typeName: "big" | "small";

  date: string;
  time: string;
  endDate?: string;
  endTime?: string;

  city: string;
  courseName: string;

  courseLocation: ICourseLocation;

  status: "active" | "closed" | "completed";

  isWinnerDeclared: boolean;

  courseRating: number;
  teeTime?: string;

  slopeRating: number;

  numberOfPlayers: number;

  gaggleLength?: number;

  handicapFromRange?: number;
  handicapToRange?: number;

  playingConditionAdjustment?: number;

  tournamentImage: Record<string, unknown>;
}
