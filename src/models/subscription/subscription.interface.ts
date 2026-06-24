import { Types } from "mongoose";

export interface ISubscription {
  subscribUser: Types.ObjectId;
  subscriptionType: "basicUser" | "superUser";
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: "active" | "inactive" | "canceled";
  startDate: Date;
  endDate?: Date;
  planPrice: number;
  planType: string;
  paymentMethod: "credit_card" | "paypal";
  lastPaymentDate?: Date;
  reminderSent: boolean;
  isApproved: boolean;
}
