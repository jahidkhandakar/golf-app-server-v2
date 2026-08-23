import express from "express";
import rateLimit from "express-rate-limit";
import { AdminAuthController } from "./admin.auth.controller";

const router = express.Router();

// Rate-limited admin login (spec §16): throttle brute force by IP on top of the
// per-account lockout in the service.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

router.post("/login", loginLimiter, AdminAuthController.login);
router.post("/2fa", loginLimiter, AdminAuthController.verifyTwoFactor);

export const AdminAuthRoutes = router;
