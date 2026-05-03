import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

const validateRequest =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = { ...req.body };
      await schema.parseAsync(body);
      req.body = body;
      next();
    } catch (error) {
      next(error);
    }
  };

export default validateRequest;
