import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import {
  ADMIN_JWT_SECRET,
  JWT_SECRET_KEY,
  ADMIN_SESSION_MINUTES,
} from "../config";

/**
 * Admin auth is fully separate from user auth (spec §16): its own token secret,
 * its own middleware. A "pending" token is issued after the password step and
 * only grants the 2FA endpoints; a "full" token (post-2FA) grants admin actions.
 */

export interface AdminJwtPayload {
  adminId: string;
  email: string;
  stage: "pending" | "full";
}

// Distinct secret from the user JWT so the two auth paths never share trust.
// Falls back to a derived value so the app still boots without extra config.
const adminSecret = (): string =>
  ADMIN_JWT_SECRET || `admin::${JWT_SECRET_KEY}`;

export const signAdminToken = (
  payload: AdminJwtPayload,
  minutes = Number(ADMIN_SESSION_MINUTES) || 30,
): string => jwt.sign(payload, adminSecret(), { expiresIn: `${minutes}m` });

export const verifyAdminToken = (token: string): AdminJwtPayload | null => {
  try {
    return jwt.verify(token, adminSecret()) as AdminJwtPayload;
  } catch {
    return null;
  }
};

/** Require a fully-authenticated admin (password + 2FA). Attaches req.admin. */
export const adminAuth: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token =
    req.headers.authorization?.split(" ")[1] || req.cookies?.adminToken;
  const payload = token ? verifyAdminToken(token) : null;

  if (!payload || payload.stage !== "full") {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }
  (req as Request & { admin?: AdminJwtPayload }).admin = payload;
  next();
};

/** Read the authenticated admin off the request (after adminAuth). */
export const getAdmin = (req: Request): AdminJwtPayload =>
  (req as Request & { admin?: AdminJwtPayload }).admin as AdminJwtPayload;
