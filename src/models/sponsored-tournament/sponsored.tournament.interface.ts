import { Types } from "mongoose";

interface ILocation {
  type: "Point";
  coordinates: [number, number];
}

export interface ISponserTournament {
  sponserCreator?: Types.ObjectId;
  sponserImage: Record<string, unknown>;
  name: string;
  location?: ILocation;
  latitude?: number;
  longitude?: number;
  link: string;
}
