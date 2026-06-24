import { Types } from "mongoose";

export interface ISubscribe {
  createdBy?: Types.ObjectId;
  subscribeType: "basicUser" | "superUser";
  price: number;
  features: string[];
  typeOfSubscription?: "month" | "year";
}
