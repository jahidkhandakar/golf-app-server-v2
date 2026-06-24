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
