import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { AdminAuthService } from "./admin.auth.service";

const clientIp = (req: Request): string =>
  (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
  req.ip ||
  "unknown";

/** Step 1: email + password → pending token (+ 2FA-setup on first login). */
const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await AdminAuthService.login(email, password, clientIp(req));
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Password accepted. Two-factor verification required.",
    data: result,
  });
});

/** Step 2: pending token + TOTP code → full admin session token. */
const verifyTwoFactor = catchAsync(async (req: Request, res: Response) => {
  const { pendingToken, token } = req.body;
  const result = await AdminAuthService.verifyTwoFactor(
    pendingToken,
    token,
    clientIp(req),
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Admin authenticated.",
    data: result,
  });
});

export const AdminAuthController = { login, verifyTwoFactor };
