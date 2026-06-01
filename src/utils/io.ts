import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { socketAuthMiddleware } from "../middlewares/socket";
import { logger } from "../logger/logger";

let io: Server;

export const initIO = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    logger.info(`User connected: ${userId} (Socket: ${socket.id})`);

    socket.join(userId);

    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${userId}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
