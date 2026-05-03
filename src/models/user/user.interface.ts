import { Document } from "mongoose";
import { IRole } from "./../../middlewares/auth";

export interface IUser extends Document {
  fullName?: string;
  email: string;
  password: string;
  role: IRole;
  phoneNumber: string;
  dateOfBirth?: string;
  profilePhoto?: string;
  provider?: "google" | "apple";
  providerId?: string;
  isDeleted: boolean;
  status: "pending" | "active" | "inactive" | "suspended" | "deleted";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOTP extends Document {
  email: string;
  otp: string;
  verified: boolean;
  expiresAt: Date;
}
