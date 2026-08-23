import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { PlanConfigService } from "./plan.config.service";
import { getAdmin } from "../../middlewares/adminAuth";

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
  const result = await PlanConfigService.updatePlan(
    getAdmin(req).adminId,
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
