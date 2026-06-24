import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import { ChallengeMatchService } from "./challenge.match.service";
import sendResponse from "../../utils/sendResponse";
import { JwtUserPayload } from "../../middlewares/auth";

const getChallengeMatches = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name } = req.query;

  const result = await ChallengeMatchService.getChallengeMatches(
    id as string,
    name as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Challenge matches fetched successfully.",
    data: result,
  });
});

const createChallengeMatch = catchAsync(async (req, res) => {
  const { id: userId } = req.user as JwtUserPayload;
  const teeSheetId = req.params.id;
  const result = await ChallengeMatchService.createChallengeMatch(
    req.body,
    teeSheetId as string,
    userId,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Challenge match created successfully.",
    data: result,
  });
});

const updateChallengeMatches = catchAsync(async (req, res) => {
  const { id: userId } = req.user as JwtUserPayload;
  const { tournamentId } = req.body;
  const { id: matchId } = req.params;
  const result = await ChallengeMatchService.updateChallengeMatches(
    userId,
    tournamentId,
    matchId as string,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Challenge match updated successfully.",
    data: result,
  });
});

const completeTournament = catchAsync(async (req, res) => {
  const { id: userId } = req.user as JwtUserPayload;
  const { id: tournamentId } = req.params;
  const result = await ChallengeMatchService.completeTournament(
    userId,
    tournamentId as string,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tournament completed successfully.",
    data: result,
  });
});

const deleteChallengeMatch = catchAsync(async (req, res) => {
  const { id: userId } = req.user as JwtUserPayload;
  const { id: matchId } = req.params;

  const result = await ChallengeMatchService.deleteChallengeMatch(
    matchId as string,
    userId,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Challenge match deleted successfully.",
    data: result,
  });
});

export const ChallengeMatchController = {
  getChallengeMatches,
  createChallengeMatch,
  updateChallengeMatches,
  completeTournament,
  deleteChallengeMatch,
};
