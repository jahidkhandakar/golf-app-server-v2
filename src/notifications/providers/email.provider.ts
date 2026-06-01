import { INotificationProvider, NotificationPayload } from "../types";
import sgMail from "@sendgrid/mail";
import { logger } from "../../logger/logger";
import { SENDGRID_API_KEY, FROM_EMAIL } from "../../config";

// init sendgrid once
sgMail.setApiKey(SENDGRID_API_KEY);

export class EmailProvider implements INotificationProvider {
  async send(payload: NotificationPayload): Promise<void> {
    try {
      const recipientEmail = payload.data?.email;

      if (!recipientEmail) {
        logger.warn(
          `No email found for user ${payload.userId}. Skipping email notification.`,
        );
        return;
      }

      const msg = {
        to: recipientEmail,
        from: FROM_EMAIL,
        subject: payload.title,
        text: payload.message,
        html: `<p>${payload.message}</p>`,
      };

      await sgMail.send(msg);

      logger.info(`Email sent to ${recipientEmail}`);
    } catch (error: any) {
      logger.error(error, "Failed to send email notification:");
      throw error;
    }
  }
}
