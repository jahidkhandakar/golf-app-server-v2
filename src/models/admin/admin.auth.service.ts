import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { AdminUser } from "./admin.model";
import { signAdminToken, verifyAdminToken } from "../../middlewares/adminAuth";
import { generateTotpSecret, verifyTotp, otpauthUrl } from "../../utils/totp";
import { writeAudit } from "../admin-audit/admin.audit.model";
import { ADMIN_CONSOLE_EMAIL, ADMIN_CONSOLE_PASSWORD } from "../../config";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const PENDING_MINUTES = 5;

/** Seed the first App Admin from env, if configured and none exists. */
export const ensureSeeded = async (): Promise<void> => {
  if (!ADMIN_CONSOLE_EMAIL || !ADMIN_CONSOLE_PASSWORD) return;
  const exists = await AdminUser.findOne({
    email: ADMIN_CONSOLE_EMAIL.toLowerCase(),
  });
  if (!exists) {
    await AdminUser.create({
      email: ADMIN_CONSOLE_EMAIL.toLowerCase(),
      password: ADMIN_CONSOLE_PASSWORD,
    });
  }
};

/**
 * Step 1 — password. Enforces lockout after repeated failures, logs the IP, and
 * returns a short-lived "pending" token plus either a 2FA-setup secret (first
 * login) or a prompt for the 2FA token.
 */
export const login = async (email: string, password: string, ip: string) => {
  const admin = await AdminUser.findOne({ email: email?.toLowerCase() }).select(
    "+password +twoFactorSecret",
  );
  if (!admin) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  if (admin.lockedUntil && admin.lockedUntil.getTime() > Date.now()) {
    throw new AppError(
      StatusCodes.TOO_MANY_REQUESTS,
      "Account temporarily locked. Try again later.",
    );
  }

  const ok = await admin.comparePassword(password);
  if (!ok) {
    admin.failedLoginCount += 1;
    if (admin.failedLoginCount >= MAX_FAILED) {
      admin.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
      admin.failedLoginCount = 0;
    }
    await admin.save();
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  admin.failedLoginCount = 0;
  admin.lastLoginIp = ip;
  admin.lastLoginAt = new Date();

  let setup: { secret: string; otpauthUrl: string } | undefined;
  if (!admin.twoFactorEnabled) {
    // First login: issue a secret to enroll an authenticator app.
    if (!admin.twoFactorSecret) admin.twoFactorSecret = generateTotpSecret();
    setup = {
      secret: admin.twoFactorSecret,
      otpauthUrl: otpauthUrl(admin.twoFactorSecret, admin.email),
    };
  }
  await admin.save();

  await writeAudit({
    actingAdmin: String(admin._id),
    action: "admin.login.password",
    metadata: { ip },
  });

  const pendingToken = signAdminToken(
    { adminId: String(admin._id), email: admin.email, stage: "pending" },
    PENDING_MINUTES,
  );

  return {
    pendingToken,
    twoFactorRequired: true,
    twoFactorSetup: setup, // present only on first login (enroll then confirm)
  };
};

/**
 * Step 2 — verify the TOTP token against the pending token. On first login this
 * also enables 2FA. Returns the full admin session token.
 */
export const verifyTwoFactor = async (
  pendingToken: string,
  token: string,
  ip: string,
) => {
  const pending = verifyAdminToken(pendingToken);
  if (!pending || pending.stage !== "pending") {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Login session expired");
  }
  const admin = await AdminUser.findById(pending.adminId).select(
    "+twoFactorSecret",
  );
  if (!admin || !admin.twoFactorSecret) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "2FA not set up");
  }
  if (!verifyTotp(admin.twoFactorSecret, token)) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid 2FA code");
  }

  if (!admin.twoFactorEnabled) {
    admin.twoFactorEnabled = true;
    await admin.save();
  }

  await writeAudit({
    actingAdmin: String(admin._id),
    action: "admin.login.2fa",
    metadata: { ip },
  });

  const adminToken = signAdminToken({
    adminId: String(admin._id),
    email: admin.email,
    stage: "full",
  });
  return { adminToken, email: admin.email };
};

export const AdminAuthService = {
  ensureSeeded,
  login,
  verifyTwoFactor,
};
