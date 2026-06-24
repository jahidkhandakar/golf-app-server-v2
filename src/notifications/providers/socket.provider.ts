import { INotificationProvider, NotificationPayload } from "../types";
import { getIO } from "../../utils/io";
import { logger } from "../../logger/logger";

export class SocketProvider implements INotificationProvider {
  async send(payload: NotificationPayload): Promise<void> {
    try {
      const io = getIO();

      // Sending to a specific room named after the userId
      io.to(payload.userId).emit("notification", {
        title: payload.title,
        message: payload.message,
        data: payload.data,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Socket notification sent to user ${payload.userId}`);
    } catch (error) {
      logger.error(error, "Failed to send socket notification:");
      // We don't necessarily want to throw here if socket is not available,
      // but for a "professional" system we should at least log it.
    }
  }
}
