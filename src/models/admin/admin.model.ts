import { Document, Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

/**
 * App Admin identity (spec §16) — a credential store fully separate from the
 * User collection. Admin is NOT a user with a role flag, so a bug in the user
 * auth path can never become an admin takeover. Creators use their normal app
 * accounts for the dashboard; only the App Admin uses this identity.
 */
export interface IAdminUser extends Document {
  email: string;
  password: string;
  twoFactorSecret?: string | null;
  twoFactorEnabled: boolean;
  failedLoginCount: number;
  lockedUntil?: Date | null;
  lastLoginIp?: string | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const adminUserSchema = new Schema<IAdminUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    twoFactorSecret: { type: String, default: null, select: false },
    twoFactorEnabled: { type: Boolean, default: false },
    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

adminUserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

adminUserSchema.methods.comparePassword = function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const AdminUser = model<IAdminUser>("AdminUser", adminUserSchema);
