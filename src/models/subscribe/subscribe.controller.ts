import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { ISubscribe } from "./subscribe.interface";
import { SubscribeService } from "./subscribe.service";

const showSubscribe = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscribeService.showSubscribe(req.query as any);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sponser retrieved successfully.",
    data: result,
  });
});

const createSubscribe = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;

  const result = await SubscribeService.createSubscribe(
    userId as string,
    req.body as ISubscribe,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Subscribe added successfully.",
    data: result,
  });
});

const updateSubscribe = catchAsync(async (req: Request, res: Response) => {
  const subscribeId = req.params.id;

  const result = await SubscribeService.updateSubscribe(
    subscribeId as string,
    req.body as ISubscribe,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Subscribe added successfully.",
    data: result,
  });
});

export const SubscribeController = {
  createSubscribe,
  showSubscribe,
  updateSubscribe,
};
