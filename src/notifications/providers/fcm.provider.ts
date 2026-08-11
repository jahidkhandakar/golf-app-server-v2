import { INotificationProvider, NotificationPayload } from "../types";
import { sendFcm, isFcmConfigured } from "../fcm";
import { User } from "../../models/user/user.model";
import { logger } from "../../logger/logger";

/**
 * Push provider (spec §7). Resolves the recipient's fcmToken from their user
 * record and sends via FCM HTTP v1. No-ops quietly when FCM isn't configured or
 * the user has no device token.
 */
export class FcmProvider implements INotificationProvider {
  async send(payload: NotificationPayload): Promise<void> {
    if (!isFcmConfigured()) return;

    const user = await User.findById(payload.userId).select("fcmToken");
    const token = user?.fcmToken;
    if (!token) return;

    // FCM v1 data values must be strings.
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(payload.data ?? {})) {
      data[k] = typeof v === "string" ? v : JSON.stringify(v);
    }

    try {
      await sendFcm(token, payload.title, payload.message, data);
    } catch (error) {
      logger.error(error, `FCM push failed for user ${payload.userId}`);
    }
  }
}
