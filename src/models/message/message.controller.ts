import { StatusCodes } from "http-status-codes";
import { MessageService } from "./message.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";



const showMyChatMessage = catchAsync(async (req: Request, res: Response) => {

    const { chatid } = req.query

    const result = await MessageService.showMyChatMessage(chatid as string)
    // Return success response
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "show all message  successfully",
        data: result,
    });
})


const sendImage = catchAsync(async (req, res) => {

    const image = {} as any

    if (req.file) {
        image.url = "/uploads/tournament/big/" + req.file.filename;
        image.path = req.file.path;
        req.body.sendfile = image

    }

    console.log(image);
    const { id: userId } = req.user as JwtUserPayload;
    const result = await MessageService.sendImage(req.body, userId)

    // Return success response
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "send image  successfully",
        data: result,
    });
})

export const MessageController = {
    showMyChatMessage,
    sendImage
}