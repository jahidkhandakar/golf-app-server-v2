import sgMail from "@sendgrid/mail";
import { OTP } from "./../user/user.model";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { SENDGRID_API_KEY, FROM_EMAIL } from "../../config";
import { logger } from "./../../logger/logger";

dayjs.extend(utc);
dayjs.extend(timezone);

sgMail.setApiKey(SENDGRID_API_KEY);

if (process.env.NODE_ENV !== "test") {
  logger.info("SendGrid email service is ready");
}

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getStoredOTP = async (email: string) => {
  const otpData = await OTP.findOne({ email: email.toLowerCase() });

  if (!otpData) {
    return { status: "not_found", otp: null };
  }

  if (otpData.expiresAt < new Date()) {
    await OTP.deleteOne({ email: email.toLowerCase() });
    return { status: "expired", otp: null };
  }

  return { status: "valid", otp: otpData.otp, verified: otpData.verified };
};

export const saveOTP = async (email: string, otp: string) => {
  await OTP.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      email: email.toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 160 * 1000),
      verified: false,
    },
    { upsert: true },
  );
};

export const sendOTPEmail = async (
  email: string,
  otp: string,
): Promise<void> => {
  const brandColor = "#A156E8";

  const emailContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Verify Your Account</title>
  </head>
  <body style="background:#f4f7fa;font-family:Arial;">
    <div style="max-width:480px;margin:40px auto;background:#fff;padding:30px;border-radius:12px;text-align:center;">
      
      <h2 style="color:${brandColor}">Golf Tournament</h2>

      <h3>Verification Code</h3>

      <p>Use this code to verify your account</p>

      <div style="font-size:36px;font-weight:bold;letter-spacing:6px;margin:20px 0;">
        ${otp}
      </div>

      <p style="color:red;font-size:13px;">Valid for 3 minutes</p>

      <p style="margin-top:20px;font-size:12px;color:#888;">
        If you didn't request this, ignore this email.
      </p>

      <hr/>

      <small>© ${new Date().getFullYear()} Golf Tournament</small>
    </div>
  </body>
  </html>
  `;

  const msg = {
    to: email,
    from: FROM_EMAIL, // must be verified in SendGrid
    subject: `${otp} is your Golf Tournament verification code`,
    html: emailContent,
    text: `Your Golf Tournament verification code is ${otp}. Valid for 3 minutes.`,
  };

  try {
    await sgMail.send(msg);
  } catch (error: any) {
    logger.error(`SendGrid email failed: ${error.message}`);

    if (error.response) {
      logger.error(error.response.body);
    }

    throw new Error("Email sending failed");
  }
};
