import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { JwtUserPayload } from "../../middlewares/auth";
import { NotificationService } from "./notification.service";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";

const getAllNotifaction = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await NotificationService.getAllNotifaction(
    userId as string,
    req.query as any,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notification retreive successfully",
    data: result,
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.query;

  const result = await NotificationService.markAsRead(id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notification read successfully",
    data: result,
  });
});

export const NotificatioController = {
  getAllNotifaction,
  markAsRead,
};
