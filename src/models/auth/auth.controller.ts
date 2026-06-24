import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { AuthService } from "./auth.service";
import { JwtUserPayload } from "./../../middlewares/auth";
import AppError from "./../../errors/AppError";
import { User } from "./../user/user.model";
import { TempUser } from "../temp_user/temp.user.model";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const userData = {
    ...req.body,
    myLocation: {
      type: "Point",
      coordinates: req.body.coordinates,
    },
  } as any;

  const { email } = userData;

  const existingUser = await User.findOne({ email });

  // Remove any previous temp registration for this email
  await TempUser.deleteOne({ email });

  if (existingUser?.status === "deleted") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Your account is deleted. Please contact support.",
    );
  }
  if (existingUser?.status === "suspended") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Your account is suspended. Please contact support.",
    );
  }

  if (existingUser) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This user already exists. Please login",
    );
  }

  const { refresh_token, token } = await AuthService.userRegister(
    userData as any,
  );

  res.cookie("refreshToken", refresh_token, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });

  res.cookie("token", token, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message:
      "OTP has been sent to your email address. Please verify it to activate your account.",
    data: { token },
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body as any;
  const { refresh_token, token, ...result } = await AuthService.loginUser(
    email as string,
    password as string,
  );

  res.cookie("refreshToken", refresh_token, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });

  res.cookie("token", token, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Login successfully.",
    data: { ...result, token },
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { otp } = req.body;
  const result = await AuthService.verifyOtp(req as any, otp as string);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Account activated successfully. Login to continue.",
    data: result,
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.resendOtp(email as string);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Otp send successfully. Please check your email.",
    data: result,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.forgotPassword(email as string);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message:
      "Otp send successfully. Please check your email to reset password.",
    data: result,
  });
});

const forgotOtpverify = catchAsync(async (req: Request, res: Response) => {
  const { otp } = req.body;
  const result = await AuthService.forgotPasswordOtpverify(
    req as any,
    otp as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Opt verified successfully. Please reset your password.",
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.resetPassword(req as any);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Password reset successfully.",
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const formData = req.body;
  const user = req.user as JwtUserPayload;
  const result = await AuthService.changePassword(
    formData as any,
    user?.id as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Password changed successfully.",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refresh_token } = req.cookies;
  const result = await AuthService.refreshToken(refresh_token);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Access token refreshed successfully.",
    data: result,
  });
});

const successLogin = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  res.cookie("token", token, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Login successful.",
    data: { token, user },
  });
});
export const AuthController = {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
  forgotOtpverify,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken,
  successLogin,
};
