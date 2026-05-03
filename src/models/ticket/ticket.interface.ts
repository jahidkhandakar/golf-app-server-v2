import { Document, Types } from "mongoose";

export interface ITicket extends Document {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  quantity: number;
  totalPrice: number;
  status: "active" | "cancelled" | "used";
  ticketId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
