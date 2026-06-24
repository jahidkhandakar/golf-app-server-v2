import express from "express";
import validateRequest from "./../../shared/validateRequest";
import { authValidation } from "./auth.validateion";
import { AuthController } from "./auth.controller";
import { auth } from "./../../middlewares/auth";
import passport from "passport";
import { clearCacheMiddleware } from "./../../middlewares/cacheMiddleware";

const router = express.Router();

router.post(
  "/register",
  validateRequest(authValidation.registerSchema),
  AuthController.registerUser,
);

router.post(
  "/login",
  validateRequest(authValidation.loginUserSchema),
  AuthController.loginUser,
);

router.post(
  "/verify-otp",
  clearCacheMiddleware("users"),
  validateRequest(authValidation.otpSchema),
  AuthController.verifyOtp,
);

router.post(
  "/resend-otp",
  validateRequest(authValidation.forgotPasswordSchema),
  AuthController.resendOtp,
);

router.post(
  "/forgot-otp-verify",
  validateRequest(authValidation.otpSchema),
  AuthController.forgotOtpverify,
);

router.post(
  "/forgot-password",
  validateRequest(authValidation.forgotPasswordSchema),
  AuthController.forgotPassword,
);

router.post(
  "/reset-password",
  clearCacheMiddleware("users"),
  validateRequest(authValidation.resetPasswordSchema),
  AuthController.resetPassword,
);

router.post(
  "/change-password",
  auth("admin", "user"),
  clearCacheMiddleware("users"),
  validateRequest(authValidation.changePasswordSchema),
  AuthController.changePassword,
);

router.post("/refresh-token", AuthController.refreshToken);
// google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  clearCacheMiddleware("users"),
  AuthController.successLogin,
);

// apple
router.get("/apple", passport.authenticate("apple"));

router.post(
  "/apple/callback",
  passport.authenticate("apple", { session: false }),
  clearCacheMiddleware("users"),
  AuthController.successLogin,
);
export const AuthRoutes = router;
