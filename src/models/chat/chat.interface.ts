import { Types } from "mongoose";

export interface IChatRoom {
    _id?: Types.ObjectId;
    participants: Types.ObjectId[];
    chatCreator: Types.ObjectId;
    stournamentId?: Types.ObjectId;
    btournamentId?: Types.ObjectId;

    type: "single" | "group";

    groupName?: string;
    groupImage?: string;
    description?: string;

    lastMessage?: Types.ObjectId;

    groupAdmins: Types.ObjectId[];

    isPinned: boolean;
    isDeleted: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}
