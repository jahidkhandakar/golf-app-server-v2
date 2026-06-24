import { Types } from "mongoose";
import { NotificationType } from "../models/notification/notification.interface";

export type NotificationChannel = "email" | "push" | "in-app" | "sms";

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
}

export interface INotificationProvider {
  send(payload: NotificationPayload): Promise<void>;
}

export interface SendNotificationParams {
  sender?: Types.ObjectId | string;
  receiver?: Types.ObjectId | string;
  title: string;
  body: string;
  type?: NotificationType;
  tournamentId?: Types.ObjectId | string | null;
  paymentId?: Types.ObjectId | string | null;
  linkId?: string | null;
  isRequest?: boolean;
  metadata?: Record<string, any> | null;
}
