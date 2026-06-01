import AppError from "./../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "./../../config/index";
import { User, OTP } from "./../user/user.model";
import { IUser } from "./../user/user.interface";
import { Request } from "express";
import {
  generateOTP,
  saveOTP,
  getStoredOTP,
  sendOTPEmail,
} from "./../send-email/sendEmailService";
import bcrypt from "bcryptjs";
import { TempUser } from "./../temp_user/temp.user.model";

const userRegister = async (payload: IUser) => {
  const { email } = payload;

  const user = await TempUser.create(payload);
  const otp = generateOTP();
  await saveOTP(email, otp);
  await sendOTPEmail(email, otp);

  // --- JWT Token ---
  const accessToken = jwt.sign(
    { email, role: payload.role, id: user._id },
    JWT_SECRET_KEY as string,
    { expiresIn: "10m" },
  );

  const refreshToken = jwt.sign(
    { email, role: payload.role, id: user._id },
    JWT_SECRET_KEY as string,
    { expiresIn: "1d" },
  );

  const userObj = user.toObject();
  const { password, ...safeUser } = userObj;

  return {
    results: safeUser,
    token: accessToken,
    refresh_token: refreshToken,
  };
};

const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+password")
    .lean();

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User not found");
  }

  if (user.status === "pending") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Your account is not verified. Please verify your account.",
    );
  }

  if (user.status === "suspended") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Your account is suspended. Please contact support.",
    );
  }

  if (user.status === "deleted") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Your account is deleted. Please contact support.",
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid password");
  }

  // Generate JWT
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET_KEY as string,
    { expiresIn: "30d" },
  );

  const refreshToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET_KEY as string,
    { expiresIn: "365d" },
  );

  const { password: _password, ...safeUser } = user;

  return {
    results: safeUser,
    token: accessToken,
    refresh_token: refreshToken,
  };
};

const verifyOtp = async (req: Request, otp: string) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Token not found");
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET_KEY as string) as {
    email: string;
  };
  const email = decoded.email;

  const { status, otp: stored } = await getStoredOTP(email);

  if (status === "expired") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Token expired. Please request a new one.",
    );
  }

  if (status === "not_found") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "OTP not found from this token. Please request again.",
    );
  }

  if (stored !== otp) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Invalid OTP. Please try again.",
    );
  }

  const storedOTP = await getStoredOTP(email);

  if (!storedOTP) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Invalid or expired OTP. Please try again.",
    );
  }

  if (storedOTP.verified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP already verified");
  }

  const result = await TempUser.findOne({ email }).select("+password");

  if (!result) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User not found");
  }

  const userData = result.toObject();

  delete (userData as any).__v;

  await User.collection.insertOne({
    ...userData,
    status: "active",
    updated_at: new Date(),
    isVerified: true,
  });

  await TempUser.deleteOne({ email });

  await OTP.findOneAndUpdate({ email }, { verified: true }, { new: true });
  // Generate JWT
  const accessToken = jwt.sign(
    { id: result._id, email: result.email, role: result.role },
    JWT_SECRET_KEY as string,
    { expiresIn: "30d" },
  );

  jwt.sign(
    { id: result._id, email: result.email, role: result.role },
    JWT_SECRET_KEY as string,
    { expiresIn: "365d" },
  );
  return { results: result, token: accessToken };
};

const resendOtp = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User account not found");
  }
  const existsOtpUser = await OTP.findOne({ email });

  if (existsOtpUser) {
    await OTP.deleteOne({ email });
  }
  const otp = generateOTP();
  await saveOTP(email, otp);
  await sendOTPEmail(email, otp);

  const token = jwt.sign({ email }, JWT_SECRET_KEY as string, {
    expiresIn: "15m",
  });

  return { token, otp };
};

const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User account not found");
  }

  const otp = generateOTP();
  await saveOTP(email, otp);
  await sendOTPEmail(email, otp);

  // --- JWT Token ---
  const token = jwt.sign({ email }, JWT_SECRET_KEY as string, {
    expiresIn: "15m",
  });
  return { token, otp };
};

const forgotPasswordOtpverify = async (req: Request, otp: string) => {
  const authHeader = req.headers.authorization || req.cookies.token;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Token not found");
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET_KEY as string) as {
    email: string;
  };
  const email = decoded.email;

  const { status, otp: stored } = await getStoredOTP(email);

  if (status === "expired") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "OTP expired. Please request a new one.",
    );
  }

  if (status === "not_found") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "OTP not found from this token. Please request again.",
    );
  }

  if (stored !== otp) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Invalid OTP. Please try again.",
    );
  }

  const storedOTP = await getStoredOTP(email);

  if (!storedOTP) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Invalid or expired OTP. Please try again.",
    );
  }

  if (storedOTP.verified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "OTP already verified");
  }

  await OTP.findOneAndUpdate({ email }, { verified: true }, { new: true });

  return null;
};

const resetPassword = async (req: Request) => {
  const { newPassword, confirmPassword } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Token not found");
  }

  if (newPassword !== confirmPassword) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Passwords do not match");
  }

  const token = authHeader.split(" ")[1];

  let email: string;

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY as string) as {
      email: string;
    };
    email = decoded.email;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "Token expired, please try again",
      );
    }
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid token");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  user.password = newPassword;
  await user.save();

  return {
    message: "Password reset successful",
  };
};

const changePassword = async (payload: any, userId: string) => {
  const { oldPassword, newPassword } = payload;

  if (oldPassword === newPassword) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "New password must be different from old password",
    );
  }

  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);

  if (!isMatch) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Old password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  return {
    message: "Password changed successfully",
  };
};

const refreshToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as {
      id: string;
      email: string;
      role: string;
    };

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "User not found");
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET_KEY as string,
      { expiresIn: "1d" },
    );

    return { token: accessToken };
  } catch (error) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
  }
};

const findOrCreateUser = async (data: {
  email: string;
  name: string;
  provider: "google" | "apple";
  providerId: string;
  avatar?: string;
}) => {
  let user = await User.findOne({
    provider: data.provider,
    providerId: data.providerId,
  });

  if (!user) {
    user = await User.create({
      name: data.name,
      email: data.email,
      role: "user",
      provider: data.provider,
      providerId: data.providerId,
      image: data.avatar,
    });
  }

  return user;
};

export const AuthService = {
  userRegister,
  loginUser,
  verifyOtp,
  resendOtp,
  forgotPasswordOtpverify,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken,
  findOrCreateUser,
};
