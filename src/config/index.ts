import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.string().transform(Number).default(5000),
  BACKEND_IP: z.string().optional(),
  DATABASE_URL: z.string({
    message: "DATABASE_URL is required",
  }),
  JWT_SECRET_KEY: z.string({
    message: "JWT_SECRET_KEY is required",
  }),
  JWT_ACCESS_EXPIRATION_MINUTES: z.string({
    message: "JWT_ACCESS_EXPIRATION_MINUTES is required",
  }),
  JWT_REFRESH_EXPIRATION_DAYS: z.string({
    message: "JWT_REFRESH_EXPIRATION_DAYS is required",
  }),
  JWT_RESET_PASSWORD_EXPIRATION_MINUTES: z.string({
    message: "JWT_RESET_PASSWORD_EXPIRATION_MINUTES is required",
  }),
  JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: z.string({
    message: "JWT_VERIFY_EMAIL_EXPIRATION_MINUTES is required",
  }),
  CONTACT_MAIL: z.string({
    message: "CONTACT_MAIL is required",
  }),
  SENDGRID_API_KEY: z.string({
    message: "SENDGRID_API_KEY is required",
  }),
  EMAIL_FROM: z.string({
    message: "EMAIL_FROM is required",
  }),
  FROM_EMAIL: z.string({
    message: "FROM_EMAIL is required",
  }),
  SMTP_USERNAME: z.string({
    message: "SMTP_USERNAME is required",
  }),
  SMTP_PASSWORD: z.string({
    message: "SMTP_PASSWORD is required",
  }),
  Nodemailer_GMAIL: z.string().optional(),
  Nodemailer_GMAIL_PASSWORD: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  UPLOAD_FOLDER: z.string().optional(),
  max_file_size: z.string().transform(Number).optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string({
    message: "STRIPE_WEBHOOK_SECRET is required",
  }),
  STRIPE_SECRET_KEY: z.string({
    message: "STRIPE_SECRET_KEY is required",
  }),
  // Firebase service account for FCM push (spec §7). Optional: push no-ops
  // gracefully when unset. FIREBASE_PRIVATE_KEY may contain literal "\n".
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  CLIENT_URL: z.string().optional(),
  // Comma-separated list of allowed browser origins (admin dashboard, and
  // later the player web build). Native mobile requests send no Origin and are
  // always allowed. See spec §15 (forward compatibility for a web origin).
  CORS_ORIGINS: z.string().optional(),
  SUPPORT_EMAIL: z.string().optional(),
  SUPPORT_PHONE: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  SMTP_HOST: z.string({
    message: "SMTP_HOST is required",
  }),
  SMTP_PORT: z.string({
    message: "SMTP_PORT is required",
  }),
  WEB_SERVER_PORT: z.string({
    message: "WEB_SERVER_PORT is required",
  }),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

export const {
  NODE_ENV,
  PORT,
  BACKEND_IP,
  DATABASE_URL,
  JWT_SECRET_KEY,
  Nodemailer_GMAIL,
  Nodemailer_GMAIL_PASSWORD,
  SMTP_PORT,
  SMTP_HOST,
  SMTP_USERNAME,
  SMTP_PASSWORD,
  JWT_ACCESS_EXPIRATION_MINUTES,
  JWT_REFRESH_EXPIRATION_DAYS,
  JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
  JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  CONTACT_MAIL,
  SENDGRID_API_KEY,
  EMAIL_FROM,
  FROM_EMAIL,
  WEB_SERVER_PORT,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  UPLOAD_FOLDER,
  max_file_size,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_BUCKET_NAME,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_SECRET_KEY,
  CLIENT_URL,
  CORS_ORIGINS,
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  REDIS_URL,
} = parsedEnv.data;
