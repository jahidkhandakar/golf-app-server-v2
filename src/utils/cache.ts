/* eslint-disable @typescript-eslint/no-explicit-any */
import redis, { isRedisConnected } from "../config/redis";
import { logger } from "../logger/logger";

/**
 * Professional Caching Layer
 * Automatically switches between Redis and In-Memory based on availability.
 */

const memoryCache = new Map<string, { data: any; expires: number }>();

export const cacheGet = async (key: string): Promise<any | null> => {
  if (isRedisConnected && redis) {
    try {
      const data = await redis.get(key);
      if (data) return JSON.parse(data);
    } catch (error) {
      logger.error(error, "Redis cache get error:");
    }
  }

  // Fallback to memory
  const item = memoryCache.get(key);
  if (item && item.expires > Date.now()) {
    return item.data;
  }

  if (item) memoryCache.delete(key);
  return null;
};

export const cacheSet = async (
  key: string,
  value: any,
  ttlSeconds: number = 30,
): Promise<void> => {
  if (isRedisConnected && redis) {
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
      return;
    } catch (error) {
      logger.error(error, "Redis cache set error:");
    }
  }

  // Fallback to memory
  memoryCache.set(key, {
    data: value,
    expires: Date.now() + ttlSeconds * 1000,
  });
};

export const cacheDelete = async (key: string): Promise<void> => {
  if (isRedisConnected && redis) {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(error, "Redis cache delete error:");
    }
  }
  memoryCache.delete(key);
};

export const cacheDeletePattern = async (pattern: string): Promise<void> => {
  if (isRedisConnected && redis) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error(error, "Redis cache delete pattern error:");
    }
  }

  // Fallback to memory
  const prefix = pattern.replace("*", "");
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
};
