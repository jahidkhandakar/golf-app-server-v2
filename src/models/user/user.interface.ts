import { Document } from "mongoose";
import { Types } from "mongoose";

export type UserRole = "admin" | "user" | "basicUser" | "superUser";

type ProviderType = "google" | "apple";

type UserStatus = "pending" | "active" | "inactive" | "suspended" | "deleted";

interface IGeoPoint {
  type: "Point";
  coordinates: number[];
}

export interface IUser {
  _id?: Types.ObjectId;

  name: string;

  email: string;

  password: string;

  role?: UserRole;

  dateOfBirth: string;

  phone: string;

  image?: string;

  coverImage?: Record<string, any>;

  gender?: string;

  country: string;

  myWalet?: string;

  handicap: string;

  clubHandicap?: number | null;

  club?: Types.ObjectId;

  facebookLink?: string;
  instagramLink?: string;
  linkdinLink?: string;
  xLink?: string;

  myLocation?: IGeoPoint;
  currentLocation?: IGeoPoint;

  privacyPolicyAccepted?: boolean;

  isVerified?: boolean;

  isResetPassword?: boolean;

  isSubscribe?: boolean;

  isAprovedAsSupperUser?: boolean;

  teebox?: string;

  /** Remaining travel trials for a free user — consumed when promoted from
   *  standby into an out-of-zone event (spec §3). The full two-counter trial
   *  system is spec §16. */
  travelTrialsRemaining?: number;

  /** Comp entitlement (spec §16): free access through this date, granted by an
   *  admin or a redeemed comp/earned code instead of a store refund. */
  compFreeUntil?: Date | null;

  fcmToken?: string;

  oneTimeCode?: string | null;

  provider?: ProviderType;

  providerId?: string;

  isDeleted?: boolean;

  status?: UserStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOTP extends Document {
  email: string;
  otp: string;
  verified: boolean;
  expiresAt: Date;
}
