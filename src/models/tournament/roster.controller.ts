import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { RosterService } from "./roster.service";

/** Caller joins the standby waitlist (FIFO). Returns their position. */
const joinStandby = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await RosterService.joinStandby(
    req.params.id as string,
    userId as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `You're on the standby list at position ${result.position}.`,
    data: result,
  });
});

/** Staff promotes a standby player into the roster. */
const promote = catchAsync(async (req: Request, res: Response) => {
  const { id: staffUserId } = req.user as JwtUserPayload;
  const result = await RosterService.promoteFromStandby(
    req.params.id as string,
    staffUserId as string,
    req.params.userId as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Player promoted from standby.",
    data: result,
  });
});

/** Staff marks a player a no-show. */
const noShow = catchAsync(async (req: Request, res: Response) => {
  const { id: staffUserId } = req.user as JwtUserPayload;
  const result = await RosterService.markNoShow(
    req.params.id as string,
    staffUserId as string,
    req.params.userId as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Player marked as a no-show.",
    data: result,
  });
});

export const RosterController = {
  joinStandby,
  promote,
  noShow,
};
