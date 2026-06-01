import { Types } from "mongoose";

type MessageType = "text" | "image" | "video" | "file";

export interface IMessage {
    _id?: Types.ObjectId;
    chatRoomId: Types.ObjectId;
    sender: Types.ObjectId;

    message?: string;
    media?: string;

    messageType: MessageType;

    timestamp?: Date;

    isDeleted: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}