import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { PlanConfigService } from "./plan.config.service";

const getPlans = catchAsync(async (_req: Request, res: Response) => {
  const result = await PlanConfigService.getPlans();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Subscription plans retrieved.",
    data: result,
  });
});

const updatePlan = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await PlanConfigService.updatePlan(
    userId as string,
    req.params.tier as "basicUser" | "superUser",
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Plan updated.",
    data: result,
  });
});

export const PlanConfigController = {
  getPlans,
  updatePlan,
};
