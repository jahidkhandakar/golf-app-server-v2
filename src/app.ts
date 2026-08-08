import express, { Application, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import router from "./routes";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { logHttpRequests } from "./logger/logger";
import notFound from "./middlewares/notFound";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import { CLIENT_URL, CORS_ORIGINS, NODE_ENV } from "./config";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";

const app: Application = express();

// ------------------ Security & Performance ------------------
app.use(helmet());

// Allowed browser origins: the admin dashboard today, and a player web build
// later (spec §15). Native mobile requests carry no Origin and always pass.
// Non-production allows any origin for local development.
const allowedOrigins = [
  ...(CLIENT_URL ? [CLIENT_URL] : []),
  ...(CORS_ORIGINS
    ? CORS_ORIGINS.split(",")
        .map((o) => o.trim())
        .filter(Boolean)
    : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header: native apps, curl, same-origin/server-to-server.
      if (!origin) return callback(null, true);
      if (NODE_ENV !== "production") return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

// Optimized compression
app.use(
  compression({
    level: 1, // Prioritize speed over compression ratio
    threshold: 1024, // Only compress responses > 1KB
  }),
);

app.set("trust proxy", 1);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: "Too many requests from this IP, please try again later",
  }),
);

// ------------------ Parsing & Logging ------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(logHttpRequests);

// ------------------ Routes ------------------
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1", router);

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: "GOLF TOURNAMENT APP API",
    environment: process.env.NODE_ENV ?? "development",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    message: "API is running successfully",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Health check successful",
    data: {
      status: "ok",
      uptime: process.uptime(),
      memory: process.memoryUsage().rss,
      timestamp: Date.now(),
    },
  });
});

// ------------------ 404 & Error Handling ------------------
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

export default app;
