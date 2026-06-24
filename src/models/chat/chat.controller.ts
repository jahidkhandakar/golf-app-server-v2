import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { JwtUserPayload } from "../../middlewares/auth";
import { ChatService } from "./chat.service";

const createsingleChat = catchAsync(async (req: Request, res: Response) => {
  const { id: creator } = req.user as JwtUserPayload;

  const result = await ChatService.createsingleChat(creator, req.body);

  console.log(
    creator,
    "??????????????????????????",
    req.body,
    "_____________________________________________________",
  );

  if (result.status === 200) {
    // Return the success response
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Single chat fetched successfully.",
      data: result.existingChat,
    });
  }
  if (result.status === 201) {
    // Return the success response
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Single chat created successfully.",
      data: result.result,
    });
  }
});

const createGroupChat = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;

  const result = await ChatService.createGroupChat(userId, req.body);

  if (result.status === 200) {
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Group chat fetched successfully.",
      data: result.chatRoom,
    });
  }
  if (result.status === 201) {
    // Return the success response
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Group chat created successfully.",
      data: result.chatRoom,
    });
  }
});

const showMyChat = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;

  const result = await ChatService.showMyChat(userId as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "My chat fetched successfully.",
    data: result,
  });
});

export const ChatController = {
  createsingleChat,
  createGroupChat,
  showMyChat,
};
