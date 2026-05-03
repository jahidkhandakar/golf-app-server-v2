import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../config";
import { IRole } from "./auth";

interface IJwtPayload {
  id: string;
  email: string;
  role: IRole;
  [key: string]: unknown;
}

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
): void => {
  try {
    // console.log(
    //   "Socket auth middleware invoked",
    //   socket.handshake?.headers?.token,
    // );
    const token =
      (socket.handshake?.headers?.token as string) ||
      (socket.handshake.auth?.token as string) ||
      (socket.handshake.headers?.authorization as string)?.replace(
        "Bearer ",
        "",
      );

    if (!token) {
      return next(new Error("Authentication token missing."));
    }

    const decoded = jwt.verify(token, JWT_SECRET_KEY as string) as IJwtPayload;
    socket.data.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Invalid or expired token."));
  }
};
