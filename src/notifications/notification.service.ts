import {
  INotificationProvider,
  NotificationPayload,
  NotificationChannel,
  SendNotificationParams,
} from "./types";
import { EmailProvider } from "./providers/email.provider";
import { SocketProvider } from "./providers/socket.provider";
import { logger } from "../logger/logger";
import { INotification } from "../models/notification/notification.interface";
import { Notification } from "../models/notification/notification.model";

export class NotificationService {
  private providers: Record<NotificationChannel, INotificationProvider>;

  constructor() {
    this.providers = {
      email: new EmailProvider(),
      "in-app": new SocketProvider(),
      // Add more providers as needed (push, sms)
      push: { send: async () => logger.warn("Push provider not implemented") },
      sms: { send: async () => logger.warn("SMS provider not implemented") },
    };
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    const { channels } = payload;

    const sendPromises = channels.map(async (channel) => {
      const provider = this.providers[channel];
      if (provider) {
        try {
          await provider.send(payload);
        } catch (error) {
          logger.error(error, `Error sending notification via ${channel}:`);
        }
      } else {
        logger.warn(`No provider found for channel: ${channel}`);
      }
    });

    await Promise.all(sendPromises);
  }
}

export const notificationService = new NotificationService();

export const sendNotification = async ({
  sender,
  receiver,
  title,
  body,
  type = "general",
  tournamentId = null,
  paymentId = null,
  linkId = null,
  metadata = null,
}: SendNotificationParams): Promise<INotification> => {
  try {
    const notification = new Notification({
      sender,
      receiver,
      tournamentId,
      paymentId,
      title,
      body,
      type,
      linkId,
      metadata,
      isRequest: false,
      isRead: false,
    });

    await notification.save();

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);

    throw new Error("Failed to send notification");
  }
};
