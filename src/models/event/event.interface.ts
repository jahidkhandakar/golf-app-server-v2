import { Document, Types } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  categoryId: Types.ObjectId;
  date: Date;
  location: string;
  image: string;
  isPremium: boolean;
  price?: number;
  totalTickets: number;
  soldTickets: number;
  createdAt?: Date;
  updatedAt?: Date;
}
