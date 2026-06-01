import { Document, Types } from "mongoose";

type RequestType = "challenge" | "open";
type RequestStatus = "pending" | "accepted" | "rejected";

export interface IRequestToPlay extends Document {
    requestedUser: Types.ObjectId;
    challengedUser?: Types.ObjectId;
    tournamentcreator: Types.ObjectId;
    tournament?: Types.ObjectId;

    tournamentType?: string;

    requestType: RequestType;
    status: RequestStatus;

    isOnlyRequestToJoin: boolean;

    createdAt: Date;
    updatedAt: Date;
}