import pino from "pino";
import { Request, Response, NextFunction } from "express";

// Pino logger configuration
export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
            singleLine: true,
          },
        }
      : undefined,
});

export const logHttpRequests = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;

    const logData = {
      method: req.method,
      url: req.originalUrl,
      status,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (status >= 500) {
      logger.error(logData, "Request Failed");
    } else if (status >= 400) {
      logger.warn(logData, "Request Client Error");
    } else {
      logger.info(logData, "Request Success");
    }
  });

  next();
};

export default logger;
