import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { ClubUsersService } from "./club.users.service";

/** GET the caller's resolved role in a club (creator/subAdmin/member/nonMember). */
const getMyClubRole = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const clubId = req.params.clubId as string;

  const role = await ClubUsersService.resolveClubRole(clubId, userId as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Club role resolved.",
    data: { role },
  });
});

/** Creator-only: promote a member to sub-admin or demote back to member.
 *  Body: { userId: string, makeSubAdmin: boolean }. */
const setSubAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id: actingUserId } = req.user as JwtUserPayload;
  const clubId = req.params.clubId as string;
  const { userId: targetUserId, makeSubAdmin } = req.body;

  const result = await ClubUsersService.setClubSubAdmin(
    clubId,
    actingUserId as string,
    targetUserId,
    Boolean(makeSubAdmin),
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: makeSubAdmin
      ? "Member promoted to sub-admin."
      : "Sub-admin demoted to member.",
    data: result,
  });
});

export const ClubUsersController = {
  getMyClubRole,
  setSubAdmin,
};
