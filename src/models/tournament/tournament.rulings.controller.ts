import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { TournamentRulingsService } from "./tournament.rulings.service";

/** Staff Cancel Round: void the tournament and its active challenges, notify
 *  players. Body: { reason? }. (spec §10) */
const cancelRound = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const tournamentId = req.params.id as string;

  const result = await TournamentRulingsService.cancelRound(
    tournamentId,
    userId as string,
    req.body?.reason,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Round cancelled. All results and challenges voided.",
    data: result,
  });
});

export const TournamentRulingsController = {
  cancelRound,
};
