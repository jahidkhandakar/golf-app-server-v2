import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { TournamentService } from "./tournament.service";

const getAllTournament = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;

  const result = await TournamentService.getAllTournament(
    req.query as any,
    userId as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Clubs retrieved successfully.",
    data: result,
  });
});

const getTournaments = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;

  const result = await TournamentService.getTournaments(
    req.query as any,
    userId as string,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tournaments retrieved successfully.",
    data: result,
  });
});

const getAllMyTournamentCommon = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await TournamentService.getAllMyTournamentCommon(
      req.query as any,
      userId as string,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Tournaments retrieved successfully.",
      data: result,
    });
  },
);

const getMyAllTournament = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;

  const result = await TournamentService.getMyAllTournament(
    req.query as any,
    userId as string,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tournaments retrieved successfully.",
    data: result,
  });
});

const getAllCompleteTournament = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await TournamentService.getAllCompleteTournament(
      req.query as any,
      userId as string,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Tournaments retrieved successfully.",
      data: result,
    });
  },
);

const getAllEnteredTournaments = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await TournamentService.getAllEnteredTournaments(
      req.query as any,
      userId as string,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Tournaments retrieved successfully.",
      data: result,
    });
  },
);

const createTournament = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;

  const tournamentImage: any = {};

  if (req.file) {
    tournamentImage.url = "/uploads/tournament/big/" + req.file.filename;
    tournamentImage.path = req.file.path;
  }
  if (req.file) {
    req.body.tournamentImage = tournamentImage;
  }

  const result = await TournamentService.createTournament(
    req.body as any,
    userId as string,
  );
  // Prepare the data object with proper coordinates
  // const data = {
  //     slopeRating: req.body.slopeRating,
  //     courseRating: req.body.courseRating,
  //     courseName: req.body.courseName,
  // };

  // await tournamentCoursService.createTournamentCoursSerivce(data);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Tournament created successfully.",
    data: result,
  });
});

const updateTournament = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const tournamentId = req.params.tournamentId;

  const tournamentImage: any = {};

  if (req.file) {
    tournamentImage.url = "/uploads/tournament/big/" + req.file.filename;
    tournamentImage.path = req.file.path;
    req.body.tournamentImage = tournamentImage;
  }

  const result = await TournamentService.updateTournament(
    req.body as any,
    userId as string,
    tournamentId as string,
  );
  // Prepare the data object with proper coordinates
  // const data = {
  //     slopeRating: req.body.slopeRating,
  //     courseRating: req.body.courseRating,
  //     courseName: req.body.courseName,
  // };

  // await tournamentCoursService.createTournamentCoursSerivce(data);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tournament updated successfully.",
    data: result,
  });
});

const getTournamentFindById = catchAsync(
  async (req: Request, res: Response) => {
    const tournamentId = req.params.tournamentId;

    const result = await TournamentService.getTournamentFindById(
      tournamentId as string,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Tournament retrieved successfully.",
      data: result,
    });
  },
);

const deleteTournament = catchAsync(async (req: Request, res: Response) => {
  const tournamentId = req.params.tournamentId;
  const { id: userId } = req.user as JwtUserPayload;

  const result = await TournamentService.deleteTournament(
    tournamentId as string,
    userId as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tournament retrieved successfully.",
    data: result,
  });
});

const makeRequestToPlay = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const { tournamentId } = req.body;

  const result = await TournamentService.makeRequestToPlay(
    tournamentId as string,
    userId as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Request to Play Tournament successfully",
    data: result,
  });
});

const showAllMyTournanmnetForRequest = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await TournamentService.showAllMyTournanmnetForRequest(
      userId as string,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Request to Play Tournament successfully",
      data: result,
    });
  },
);

const showAllTournanmnetForRequestAproved = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;
    const tournamentId = req.params.tournamentId;

    const result = await TournamentService.showAllTournanmnetForRequestAproved(
      tournamentId as string,
      userId as string,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Request to Play Tournament approved successfully",
      data: result,
    });
  },
);

const showAllMyTournanmnetForRequestRejected = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;
    const tournamentId = req.params.tournamentId;

    const result =
      await TournamentService.showAllMyTournanmnetForRequestRejected(
        tournamentId as string,
        userId as string,
      );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Request rejected successfully",
      data: result,
    });
  },
);

const showallAprovedTourmant = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await TournamentService.showallAprovedTourmant(
      userId as string,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Request rejected successfully",
      data: result,
    });
  },
);

const showallRejectTourmant = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await TournamentService.showallRejectTourmant(
      userId as string,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Request rejected successfully",
      data: result,
    });
  },
);

const getAllUsersInTournament = catchAsync(
  async (req: Request, res: Response) => {
    const tournamentId = req.params.id;
    const result = await TournamentService.getAllUsersInTournament(
      tournamentId as string,
      req.query.name as string,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Request rejected successfully",
      data: result,
    });
  },
);

export const TournamentController = {
  createTournament,
  getTournaments,
  getAllMyTournamentCommon,
  getAllTournament,
  getAllEnteredTournaments,
  getMyAllTournament,
  getAllCompleteTournament,
  getTournamentFindById,
  updateTournament,
  deleteTournament,
  makeRequestToPlay,
  showallRejectTourmant,
  showallAprovedTourmant,
  showAllMyTournanmnetForRequestRejected,
  showAllTournanmnetForRequestAproved,
  showAllMyTournanmnetForRequest,
  getAllUsersInTournament,
};
