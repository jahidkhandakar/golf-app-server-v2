import Redis from "ioredis";
import { REDIS_URL, NODE_ENV } from "./index";
import { logger } from "../logger/logger";

/**
 * Professional Redis Configuration
 * Features:
 * - Silent connection management for development
 * - Graceful fallback to in-memory systems
 */

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  showFriendlyErrorStack: false,
  lazyConnect: true,
  family: 4,
  retryStrategy: (times: number) => {
    // In development, we retry much less frequently to avoid noise
    if (NODE_ENV === "development" && times > 5) {
      return null; // Give up after 5 attempts to be "professional" and quiet
    }
    return Math.min(times * 2000, 30000);
  },
};

const redis = new Redis(REDIS_URL, redisOptions);

export let isRedisConnected = false;

redis.on("connect", () => {
  isRedisConnected = true;
  logger.info("✅ Connected to Redis");
});

redis.on("ready", () => {
  isRedisConnected = true;
});

redis.on("error", (err: any) => {
  isRedisConnected = false;

  // In professional development environments, we don't spam connection errors
  if (NODE_ENV === "development") {
    return; // Stay silent
  }

  logger.error(err, "❌ Redis error:");
});

redis.on("end", () => {
  isRedisConnected = false;
});

// Attempt to connect in the background
if (REDIS_URL) {
  redis.connect().catch(() => {
    if (NODE_ENV === "development") {
      // In development, we don't log this as an error because we have an automatic fallback.
      // This keeps the terminal clean.
    }
  });
}

export default redis;
