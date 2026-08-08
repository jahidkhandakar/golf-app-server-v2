import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { KpLiveService } from "./kp.live.service";
import { ContestCategory } from "./kp.live.interface";

const pinHole = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const tournamentId = req.params.id as string;

  const result = await KpLiveService.pinHole(tournamentId, userId as string, {
    hole: Number(req.body.hole),
    coordinates: req.body.coordinates,
  });

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "KP hole pinned.",
    data: result,
  });
});

const getPins = catchAsync(async (req: Request, res: Response) => {
  const result = await KpLiveService.getPins(req.params.id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "KP pins retrieved.",
    data: result,
  });
});

const submitEntry = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const tournamentId = req.params.id as string;

  // Photos are uploaded to S3 by multiUploadHandler and surfaced here.
  const uploaded = (req.body as any).files?.photos;
  const photos: string[] = Array.isArray(uploaded)
    ? uploaded
    : uploaded
      ? [uploaded]
      : [];

  const result = await KpLiveService.submitEntry(
    tournamentId,
    userId as string,
    {
      hole: Number(req.body.hole),
      category: (req.body.category as ContestCategory) || "open",
      isLongDrive:
        req.body.isLongDrive === "true" || req.body.isLongDrive === true,
      player: req.body.player,
      distance: Number(req.body.distance),
      photos,
    },
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "KP entry recorded.",
    data: result,
  });
});

const getBoard = catchAsync(async (req: Request, res: Response) => {
  const tournamentId = req.params.id as string;
  const hole = Number(req.query.hole);
  const category = (req.query.category as ContestCategory) || "open";
  const isLongDrive = req.query.isLongDrive === "true";

  const result = await KpLiveService.getBoard(
    tournamentId,
    hole,
    category,
    isLongDrive,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "KP board retrieved.",
    data: result,
  });
});

const getLeaders = catchAsync(async (req: Request, res: Response) => {
  const result = await KpLiveService.getCurrentLeaders(req.params.id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "KP leaders retrieved.",
    data: result,
  });
});

const deleteEntry = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await KpLiveService.deleteEntry(
    req.params.id as string,
    req.params.entryId as string,
    userId as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "KP entry removed.",
    data: result,
  });
});

export const KpLiveController = {
  pinHole,
  getPins,
  submitEntry,
  getBoard,
  getLeaders,
  deleteEntry,
};
