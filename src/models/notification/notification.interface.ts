import { Document } from "mongoose";
import { Types } from "mongoose";

export type NotificationType =
  | "payment"
  | "general"
  | "tournament"
  | "update"
  | "subscription";

export interface INotification extends Document {
  sender?: Types.ObjectId;
  receiver?: Types.ObjectId;
  tournamentId?: Types.ObjectId;
  paymentId?: Types.ObjectId;

  isRequest: boolean;
  title: string;
  body: string;
  linkId?: string;

  type?: NotificationType;

  metadata?: Record<string, any>;

  isRead: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
