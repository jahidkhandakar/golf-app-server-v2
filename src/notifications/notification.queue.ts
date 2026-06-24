import { Queue, Worker, Job } from "bullmq";
import redis, { isRedisConnected } from "../config/redis";
import { NotificationPayload } from "./types";
import { notificationService } from "./notification.service";
import { logger } from "../logger/logger";
import { NODE_ENV } from "../config";

/**
 * Professional Notification Queue
 * Fallback-ready and silent during connection issues in development.
 */

const NOTIFICATION_QUEUE_NAME = "notifications";

let notificationQueue: Queue | null = null;
let notificationWorker: Worker | null = null;

if (redis) {
  notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: 1000,
    },
  });

  notificationQueue.on("error", (err) => {
    // Keep logs clean in development
    if (NODE_ENV === "development") return;
    logger.warn(`⚠️ Notification Queue Connection Issue: ${err.message}`);
  });

  notificationWorker = new Worker(
    NOTIFICATION_QUEUE_NAME,
    async (job: Job<NotificationPayload>) => {
      logger.info(`🔔 Processing background notification: ${job.id}`);
      await notificationService.sendNotification(job.data);
    },
    {
      connection: redis,
    },
  );

  notificationWorker.on("error", (err) => {
    if (NODE_ENV === "development") return;
    logger.warn(`⚠️ Notification Worker Connection Issue: ${err.message}`);
  });

  notificationWorker.on("completed", (job) => {
    logger.info(`✅ Notification job ${job.id} completed`);
  });
}

export const queueNotification = async (payload: NotificationPayload) => {
  // Use Redis if available
  if (isRedisConnected && notificationQueue) {
    try {
      await notificationQueue.add(
        `notify-${payload.userId}-${Date.now()}`,
        payload,
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
        },
      );
      return;
    } catch (error) {
      // Failed to queue, will fallback below
    }
  }

  // Professional Fallback: Process immediately in background
  setImmediate(async () => {
    try {
      await notificationService.sendNotification(payload);
    } catch (error) {
      logger.error(error, `❌ Notification failed for user ${payload.userId}:`);
    }
  });
};
