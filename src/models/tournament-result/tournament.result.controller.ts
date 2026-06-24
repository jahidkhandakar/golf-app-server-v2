import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { TournamentResultService } from "./tournament.result.service";

const getAllTournamentResult = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await TournamentResultService.getAllTournamentResult(
      req.query as any,
      userId as string,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Tournament Result retrieved successfully.",
      data: result,
    });
  },
);

const getAllTopPlayersResult = catchAsync(
  async (req: Request, res: Response) => {
    const result = await TournamentResultService.getAllTopPlayersResult(
      req.query as any,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Top Players Result retrieved successfully.",
      data: result,
    });
  },
);

const addTournamentResult = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;

  const payload = req.body;

  const result = await TournamentResultService.addTournamentResult(
    payload as any,
    userId as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tournament Result added successfully.",
    data: result,
  });
});

const updateTournamentResult = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const tournamentId = req.params.id;
    const payload = req.body;

    const result = await TournamentResultService.updateTournamentResult(
      tournamentId as string,
      userId as string,
      payload as any,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Tournament Result added successfully.",
      data: result,
    });
  },
);

const getLeaderboard = catchAsync(async (req: Request, res: Response) => {
  const clubId = req.params.clubId;
  const result = await TournamentResultService.getLeaderboard(
    clubId as string,
    req.query as any,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Leaderboard retrieved successfully.",
    data: result,
  });
});

const findSingleTournamentResult = catchAsync(
  async (req: Request, res: Response) => {
    const tournamentId = req.params.id;

    const result = await TournamentResultService.findSingleTournamentResult(
      tournamentId as string,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Tournament Result retrieved successfully.",
      data: result,
    });
  },
);

export const TournamentResultController = {
  getAllTopPlayersResult,
  addTournamentResult,
  updateTournamentResult,
  findSingleTournamentResult,
  getLeaderboard,
  getAllTournamentResult,
};
