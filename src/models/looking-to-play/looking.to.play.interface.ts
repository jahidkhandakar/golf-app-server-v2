import { Document, Types } from "mongoose";

interface IGeoPoint {
    type: "Point";
    coordinates: [number, number];
}

export interface ILookingToPlay extends Document {
    createdBy: Types.ObjectId;

    category?: string;
    userName?: string;

    visitingFrom: IGeoPoint;
    visitingFromName?: string;

    golfCourse: string;
    cityToPlay: string;

    fromDate: Date;
    toDate: Date;

    isAccepted: boolean;
    isReject: boolean;

    createdAt: Date;
    updatedAt: Date;
}