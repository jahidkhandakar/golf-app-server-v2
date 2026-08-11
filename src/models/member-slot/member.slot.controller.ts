import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { MemberSlotService } from "./member.slot.service";
import { PrivateClubService } from "../club/private.club.service";

const createSlot = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await MemberSlotService.createSlot(
    req.params.id as string,
    userId as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Member slot created. Hand the code over personally.",
    data: result,
  });
});

const listSlots = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await MemberSlotService.listSlots(
    req.params.id as string,
    userId as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Member slots retrieved.",
    data: result,
  });
});

const joinPrivate = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await MemberSlotService.joinPrivate(
    userId as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Welcome. Your alias is visible only inside this club.",
    data: result,
  });
});

const convertToPublic = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await PrivateClubService.convertToPublic(
    req.params.id as string,
    userId as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Club converted to public.",
    data: result,
  });
});

export const MemberSlotController = {
  createSlot,
  listSlots,
  joinPrivate,
  convertToPublic,
};
