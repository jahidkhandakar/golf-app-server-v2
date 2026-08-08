import { Document, Types } from "mongoose";

/** ContestCategory mirror (spec / app). Weekly gaggles run everything as
 *  "open"; special events split into the gendered/senior categories. */
export type ContestCategory =
  "open" | "men" | "seniorMen" | "women" | "seniorWomen";

/**
 * A pinned KP hole. The first group to reach a KP hole drops the pin with GPS
 * coordinates; following groups get the 40-yard geofence popup client-side.
 * One pin per tournament+hole. (spec §1)
 */
export interface IKpPin extends Document {
  tournament: Types.ObjectId;
  hole: number;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  pinnedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A KP / long-drive entry captured on course. Entries for a given
 * hole+category+kind form the board: the leader (closest for KP, longest for
 * long drive) first, then every dethroned distance behind it. A dethroned
 * entry keeps its distance but loses its photos (deleted from S3). (spec §1)
 */
export interface IKpEntry extends Document {
  tournament: Types.ObjectId;
  hole: number;
  category: ContestCategory;
  /** false = closest-to-pin (feet, lower is better); true = long drive
   *  (yards, higher is better). */
  isLongDrive: boolean;

  /** The winning player. Cannot be the measurer, and cannot be kpOptOut. */
  player: Types.ObjectId;
  /** Who measured. A kpOptOut player may measure for a teammate. */
  measurer: Types.ObjectId;

  distance: number;

  /** AR-captured photo URLs (two). Emptied when this entry is dethroned. */
  photos: string[];

  isLeader: boolean;
  dethronedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
