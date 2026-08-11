import {
  INotificationProvider,
  NotificationPayload,
  NotificationChannel,
  SendNotificationParams,
} from "./types";
import { EmailProvider } from "./providers/email.provider";
import { SocketProvider } from "./providers/socket.provider";
import { FcmProvider } from "./providers/fcm.provider";
import { logger } from "../logger/logger";
import { INotification } from "../models/notification/notification.interface";
import { Notification } from "../models/notification/notification.model";

export class NotificationService {
  private providers: Record<NotificationChannel, INotificationProvider>;

  constructor() {
    this.providers = {
      email: new EmailProvider(),
      "in-app": new SocketProvider(),
      push: new FcmProvider(),
      // Add more providers as needed (sms)
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

/**
 * Persist an in-app notification AND dispatch it over push + socket. Use for
 * events that should reach the device, e.g. Final Results (spec §7).
 */
export const notifyAndPush = async (params: {
  sender?: string;
  receiver: string;
  title: string;
  body: string;
  type?: SendNotificationParams["type"];
  linkId?: string | null;
  data?: Record<string, unknown>;
}): Promise<void> => {
  try {
    await sendNotification({
      sender: params.sender,
      receiver: params.receiver,
      title: params.title,
      body: params.body,
      type: params.type,
      linkId: params.linkId ?? null,
    });
  } catch (error) {
    logger.error(error, "notifyAndPush: DB persist failed");
  }
  await notificationService.sendNotification({
    userId: params.receiver,
    title: params.title,
    message: params.body,
    data: params.data,
    channels: ["push", "in-app"],
  });
};
