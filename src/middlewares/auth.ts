import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

export interface JwtUserPayload {
  id: string;
  email: string;
  role: IRole;
}

export type IRole = "admin" | "user";

export const auth = (...roles: IRole[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies.token;
    const token = authHeader?.split(" ")[1] || cookieToken;

    // console.log("Authorization Header:", authHeader);
    // console.log("Cookie Token:", cookieToken);
    // console.log("Final Token:", token);

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
        process.env.JWT_SECRET_KEY!,
      ) as JwtUserPayload;
      req.user = decoded; // now typed

      // Check roles
      if (roles.length > 0 && !roles.includes(decoded.role)) {
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
