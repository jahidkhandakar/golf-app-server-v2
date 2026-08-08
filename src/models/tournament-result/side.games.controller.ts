import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { SideGamesService } from "./side.games.service";

/** Staff enters a player's per-hole scores. Body: { player, holes[], teeBox? }. */
const enterHoleScores = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const tournamentId = req.params.tournamentId as string;

  const result = await SideGamesService.enterHoleScores(
    tournamentId,
    userId as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Scores saved.",
    data: result,
  });
});

/** Authoritative live skins + KP values, computed on demand. */
const getLiveSideGames = catchAsync(async (req: Request, res: Response) => {
  const tournamentId = req.params.tournamentId as string;

  const result = await SideGamesService.getLiveSideGames(tournamentId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Live side games computed.",
    data: result,
  });
});

export const SideGamesController = {
  enterHoleScores,
  getLiveSideGames,
};
