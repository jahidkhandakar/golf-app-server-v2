import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request } from "express";

/**
 * Rate limiters for the endpoints bots hammer first (spec §1/§12 hardening):
 * authentication, code redemption, and score/contest submission. Keyed per
 * account AND per IP where the caller is authenticated, with a cooldown window.
 */

const common = {
  standardHeaders: true as const,
  legacyHeaders: false as const,
};

// account + IP composite key (IPv6-safe via ipKeyGenerator). Falls back to IP
// only on unauthenticated routes.
const accountAndIp = (req: Request): string => {
  const uid = (req as Request & { user?: { id?: string } }).user?.id;
  const ipKey = ipKeyGenerator(req.ip ?? "");
  return uid ? `${uid}:${ipKey}` : ipKey;
};

/** Authentication endpoints (login, register, OTP, password reset). IP-keyed —
 *  these run before auth. */
export const authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many attempts. Try again later." },
});

/** Code redemption — 5 tries then a cooldown (spec §12 brute-force example). */
export const redemptionLimiter = rateLimit({
  ...common,
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: accountAndIp,
  message: {
    success: false,
    message: "Too many code attempts. Please wait before trying again.",
  },
});

/** Score / contest submission — generous but bounded, per account + IP. */
export const submissionLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: accountAndIp,
  message: {
    success: false,
    message: "Submitting too quickly. Slow down a moment.",
  },
});
