import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { TemplateService } from "./template.service";

const saveTemplate = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await TemplateService.saveTemplate(userId as string, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Template saved.",
    data: result,
  });
});

const getTemplates = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  // Creators only see their own; the creatorId query is honored for App Admin
  // tooling but defaults to the caller.
  const creatorId = (req.query.creatorId as string) || (userId as string);
  const result = await TemplateService.getTemplates(creatorId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Templates retrieved.",
    data: result,
  });
});

const deleteTemplate = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await TemplateService.deleteTemplate(
    req.params.id as string,
    userId as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Template deleted.",
    data: result,
  });
});

export const TemplateController = {
  saveTemplate,
  getTemplates,
  deleteTemplate,
};
