import { model, Schema } from "mongoose";
import { ILookingToPlay } from "./looking.to.play.interface";

const lookingToPlaySchema = new Schema<ILookingToPlay>(
    {
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        category: {
            type: String,
            trim: true,
        },

        userName: {
            type: String,
            trim: true,
        },

        visitingFrom: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
                default: [0, 0],
            },
        },

        visitingFromName: {
            type: String,
            trim: true,
        },

        golfCourse: {
            type: String,
            required: true,
            trim: true,
        },

        cityToPlay: {
            type: String,
            required: true,
            trim: true,
        },

        fromDate: {
            type: Date,
            required: true,
        },

        toDate: {
            type: Date,
            required: true,
        },

        isAccepted: {
            type: Boolean,
            default: false,
        },

        isReject: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

lookingToPlaySchema.index({
    visitingFrom: "2dsphere",
});

export const LookingToPlay = model<ILookingToPlay>(
    "LookingToPlay",
    lookingToPlaySchema
);
