/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import { cacheGet, cacheSet } from "../utils/cache";


export const cacheMiddleware =
  (keyPrefix: string) =>
    async (req: Request, res: Response, next: NextFunction) => {
      const key = `${keyPrefix}:${req.originalUrl}`;

      const cached = await cacheGet(key);
      if (cached) return res.status(200).json(cached);

      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        cacheSet(key, body, 15); // cache 5 mins
        return originalJson(body);
      };

      next();
    };


