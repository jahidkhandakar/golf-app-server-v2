/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import { cacheGet, cacheSet, cacheDeletePattern } from "../utils/cache";

/**
 * Cache GET requests for a fast response.
 * @param keyPrefix Prefix for the cache key (e.g., 'categories', 'events')
 * @param ttlSeconds Cache duration in seconds (default: 60 seconds)
 */
export const cacheMiddleware =
  (keyPrefix: string, ttlSeconds: number = 60) =>
  async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const userId = (req as any).user?.id || (req as any).user?._id;
    const key = userId
      ? `${keyPrefix}:user:${userId}:${req.originalUrl}`
      : `${keyPrefix}:${req.originalUrl}`;

    try {
      const cached = await cacheGet(key);
      if (cached) {
        return res.status(200).json(cached);
      }

      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheSet(key, body, ttlSeconds);
        }
        return originalJson(body);
      };
    } catch (err) {
      // Fail-silent: if cache fails, proceed to DB
    }

    next();
  };

/**
 * Automatically clears the cache for a key prefix when a mutating request succeeds.
 * @param keyPrefix Prefix to clear (e.g., 'categories', 'events')
 */
export const clearCacheMiddleware =
  (keyPrefix: string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheDeletePattern(`${keyPrefix}:*`);
        }
        return originalJson(body);
      };
    } catch (err) {
      // Fail-silent
    }
    next();
  };
