import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { SubscriptionService } from "./subscription.service";
import { ISubscription } from "./subscription.interface";

const showAllSubscribeRequestedUser = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SubscriptionService.showAllSubscribeRequestedUser();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Subscribe requested users retrieved successfully.",
      data: result,
    });
  },
);

const createSubscription = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;

  const result = await SubscriptionService.createSubscription(
    userId,
    req.body as Partial<ISubscription>,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Subscription created successfully.",
    data: result,
  });
});

const showAllSubscribeUser = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.showAllSubscribeUser();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Subscribe users retrieved successfully.",
    data: result,
  });
});

const showAllSubscribeUserBlock = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SubscriptionService.showAllSubscribeUserBlock();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Blocked subscribe users retrieved successfully.",
      data: result,
    });
  },
);

const canceledSubscriber = catchAsync(async (req: Request, res: Response) => {
  const { id: adminId } = req.user as JwtUserPayload;
  const { subscribUser, subscribeId } = req.query as {
    subscribUser: string;
    subscribeId: string;
  };

  const result = await SubscriptionService.canceledSubscriber(
    subscribUser,
    subscribeId,
    adminId,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Subscription canceled successfully.",
    data: result,
  });
});

const acceptSubscribUser = catchAsync(async (req: Request, res: Response) => {
  const { id: adminId } = req.user as JwtUserPayload;
  const { subscribUser, subscribeId } = req.query as {
    subscribUser: string;
    subscribeId: string;
  };

  const result = await SubscriptionService.acceptSubscribUser(
    subscribUser,
    subscribeId,
    adminId,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Subscription approved successfully.",
    data: result,
  });
});

export const SubscriptionController = {
  createSubscription,
  showAllSubscribeRequestedUser,
  showAllSubscribeUser,
  showAllSubscribeUserBlock,
  canceledSubscriber,
  acceptSubscribUser,
};
