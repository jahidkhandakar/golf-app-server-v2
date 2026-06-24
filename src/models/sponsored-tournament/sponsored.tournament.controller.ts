import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { ISponserTournament } from "./sponsored.tournament.interface";
import { SponsoredTournamentService } from "./sponsored.tournament.service";

const showAllsponserTournament = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result =
      await SponsoredTournamentService.showAllsponserTournament(userId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Sponser retrieved successfully.",
      data: result,
    });
  },
);

const createSponserTournament = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const sponserImage: any = {};

    if (req.file) {
      sponserImage.url = "/uploads/tournament/big/" + req.file.filename;
      sponserImage.path = req.file.path;
    }
    if (req.file) {
      req.body.sponserImage = sponserImage;
    }

    const result = await SponsoredTournamentService.createSponserTournament(
      userId as string,
      req.body as ISponserTournament,
    );

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Sponser added successfully.",
      data: result,
    });
  },
);

const updateSponserTournament = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;
    const sponserId = req.params.id;

    const sponserImage: any = {};

    if (req.file) {
      sponserImage.url = "/uploads/tournament/big/" + req.file.filename;
      sponserImage.path = req.file.path;
    }
    if (req.file) {
      req.body.sponserImage = sponserImage;
    }

    const result = await SponsoredTournamentService.updateSponserTournament(
      sponserId as string,
      req.body as ISponserTournament,
      userId as string,
    );

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Sponser updated successfully.",
      data: result,
    });
  },
);

export const SponsoredTournamentController = {
  showAllsponserTournament,
  updateSponserTournament,
  createSponserTournament,
};
