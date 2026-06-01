import { Document, Types } from "mongoose";

export interface IClub extends Document {
    name?: string;

    createdBy: Types.ObjectId;

    clubLogo: Record<string, any>;

    location: {
        type: "Point";
        coordinates: number[];
    };

    description?: string;

    maxPlayers?: number;

    isDeleted: boolean;

    city?: string;

    totalPlayers: number;

    createdAt: Date;
    updatedAt: Date;
}