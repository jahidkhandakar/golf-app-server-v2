import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.string().transform(Number).default(5000),
  IP: z.string().optional(),
  DATABASE_URL: z.string({
    message: "DATABASE_URL is required",
  }),
  JWT_SECRET_KEY: z.string({
    message: "JWT_SECRET_KEY is required",
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
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  CLIENT_URL: z.string().optional(),
  SUPPORT_EMAIL: z.string().optional(),
  SUPPORT_PHONE: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  HF_TOKEN: z.string().optional(),
  HF_API_KEY_TWO: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

export const {
  NODE_ENV,
  PORT,
  IP,
  DATABASE_URL,
  JWT_SECRET_KEY,
  Nodemailer_GMAIL,
  Nodemailer_GMAIL_PASSWORD,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  UPLOAD_FOLDER,
  max_file_size,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_BUCKET_NAME,
  STRIPE_WEBHOOK_SECRET: WEB_HOOK_SECRET,
  STRIPE_SECRET_KEY,
  CLIENT_URL,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  OPENAI_API_KEY,
  HF_TOKEN,
  HF_API_KEY_TWO,
  GROQ_API_KEY,
} = parsedEnv.data;
