import { model, Schema } from "mongoose";
import { IInvitation } from "./invitation.interface";


const invitationSchema = new Schema<IInvitation>(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        tournament: {
            type: Schema.Types.ObjectId,
            ref: "Tournament",
            required: false,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

export const Invitation = model<IInvitation>("Invitation", invitationSchema);
