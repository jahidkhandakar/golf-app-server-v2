import { Types } from "mongoose";

export interface ICourseLocation {
  type: "Point";
  coordinates: [number, number];
}

/** How side-game money pays out (mirrors the app's PayoutMode). */
export type PayoutMode = "poolSplit" | "carryover";

/** A course-backfill guest. Guests may not be registered users, so they are
 *  stored by name. Included in side games only when guestsInSideGames is on
 *  (spec §5). */
export interface IGuest {
  name: string;
}

/**
 * Side-game setup for a tournament — the server-side mirror of the app's
 * ContestConfig. The competition engine (spec §1,4,5,10) reads this to compute
 * skins / KP / long-drive winners authoritatively.
 */
export interface IContestConfig {
  /** Par for holes 1..18 in order. */
  holePars: number[];
  kpHoles: number[];
  longDriveHoles: number[];
  payoutMode: PayoutMode;
  skinsPot: number;
  kpPot: number;
  longDrivePot: number;
  useCategories: boolean;
  skinsDeductMidPercent: number;
  skinsDeductPlusPercent: number;
  kpLiveEnabled: boolean;
  guestsInSideGames: boolean;
  /** Registered players excluded from skins / KPs (spec §4). */
  skinsOptOut: Types.ObjectId[];
  kpOptOut: Types.ObjectId[];
  guests: IGuest[];
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

  status: "active" | "closed" | "completed" | "cancelled";

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

  /** Side-game configuration (skins, KP, long drive). Optional: not every
   *  tournament runs side games. */
  contestConfig?: IContestConfig;

  /** Whether the app displays dollar amounts at all. Default off. Also forced
   *  off server-side when the payout exceeds the country cap (spec §2). */
  showAmounts: boolean;

  /** Set true by finalize(); the FCM push job reads it to notify players that
   *  results are final (spec §7). */
  finalResultsPushSent: boolean;
}
