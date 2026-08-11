import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { TournamentRulingsService } from "./tournament.rulings.service";
import { TournamentFinalizeService } from "./tournament.finalize.service";

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

/** Staff: (re)arm the 24-hour money purge. Body: { delayMs? }. Normally armed
 *  automatically at Final. (spec §2) */
const scheduleAmountPurge = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const tournamentId = req.params.id as string;

  const result = await TournamentRulingsService.scheduleFinalAmountPurge(
    tournamentId,
    userId as string,
    req.body?.delayMs,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.scheduled
      ? "Amount purge scheduled."
      : "Amount purge could not be scheduled (queue unavailable).",
    data: result,
  });
});

/** Staff: finalize the tournament — official winners, push, and armed purge. */
const finalize = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await TournamentFinalizeService.finalize(
    req.params.id as string,
    userId as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Results are final.",
    data: result,
  });
});

export const TournamentRulingsController = {
  cancelRound,
  scheduleAmountPurge,
  finalize,
};
