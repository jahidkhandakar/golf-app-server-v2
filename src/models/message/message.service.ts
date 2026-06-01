import { ChatRoom } from "../chat/chat.model";
import { Message } from "./message.model";

const showMyChatMessage = async (chatid: string) => {
    const result = await Message.find({ chatRoomId: chatid }).populate("sender", "name image")
    console.log(result, chatid);

    return result

}


const sendImage = async (data: any, userId: string) => {
    const creater = await ChatRoom.findById(data.chatid);
    if (!creater) {
        throw new Error('Chat room not found');
    }

    const allowSend =
        creater.type === "single" ||
        creater.chatCreator.toString() === userId.toString();

    if (!allowSend) {
        throw new Error('Unauthorized action');
    }

    const datas = {
        media: data.sendfile.url,
        messageType: "image",
        sender: userId,
        chatRoomId: data.chatid,
        message: "", // placeholder for image message
    } as any;

    const result = await Message.create(datas);
    await result.populate("sender", "name image");
    await ChatRoom.findByIdAndUpdate(data.chatid, { lastMessage: result._id });

    // Emit real-time message using global.io
    const messageEvent = `newMessage::${data.chatid}`;
    global.io.emit(messageEvent, {
        success: true,
        data: { attributes: [result] },
    });

    return result;
};


export const MessageService = {
    showMyChatMessage,
    sendImage
}