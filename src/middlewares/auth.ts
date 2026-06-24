import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

export interface JwtUserPayload {
  id: string;
  email: string;
  role: IRole;
}

export type IRole = "admin" | "user" | "basicUser" | "superUser";

type AuthRole = IRole | "common";

export const auth = (...roles: AuthRole[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies.token;
    const token = authHeader?.split(" ")[1] || cookieToken;

    if (!token) {
      console.log("Access denied. No token provided");
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY as string,
      ) as JwtUserPayload;

      req.user = decoded;

      // If no role restriction provided → just allow
      if (roles.length === 0) {
        return next();
      }

      // COMMON means allow all authenticated users
      const isCommonAccess = roles.includes("common");

      if (!isCommonAccess && !roles.includes(decoded.role)) {
        console.log("You are not authorized");
        return res.status(403).json({
          success: false,
          message: "You are not authorized",
        });
      }

      next();
    } catch (error) {
      console.log("Invalid token.");
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
  };
};
