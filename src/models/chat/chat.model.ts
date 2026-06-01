import { Schema, model } from "mongoose";
import { IChatRoom } from "./chat.interface";

const ChatRoomSchema = new Schema<IChatRoom>(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        chatCreator: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        stournamentId: {
            type: Schema.Types.ObjectId,
            ref: "SmallTournament",
            required: false,
        },

        btournamentId: {
            type: Schema.Types.ObjectId,
            ref: "Tournament",
            required: false,
        },

        type: {
            type: String,
            enum: ["single", "group"],
            default: "single",
        },

        groupName: {
            type: String,
            trim: true,
            default: "",
        },

        groupImage: {
            type: String,
            trim: true,
            default: "",
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message",
        },

        groupAdmins: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        isPinned: {
            type: Boolean,
            default: false,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const ChatRoom = model<IChatRoom>("ChatRoom", ChatRoomSchema);