import express from "express";
import validateRequest from "./../../shared/validateRequest";
import { authValidation } from "./auth.validateion";
import { AuthController } from "./auth.controller";
import { auth } from "./../../middlewares/auth";
import passport from "passport";

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
  validateRequest(authValidation.resetPasswordSchema),
  AuthController.resetPassword,
);

router.post(
  "/change-password",
  auth("admin", "user"),
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
  AuthController.successLogin,
);

// apple
router.get("/apple", passport.authenticate("apple"));

router.post(
  "/apple/callback",
  passport.authenticate("apple", { session: false }),
  AuthController.successLogin,
);
export const AuthRoutes = router;
