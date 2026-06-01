import { Document, Types } from "mongoose";

export interface IClubUser extends Document {
    club: Types.ObjectId;
    user: Types.ObjectId;
    status: "pending" | "accepted" | "rejected";
    createdAt?: Date;
    updatedAt?: Date;
}