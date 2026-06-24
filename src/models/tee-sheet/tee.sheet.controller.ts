import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { ITeeSheet } from "./tee.sheet.interface";
import { TeeSheetService } from "./tee.sheet.service";

const createTeeSheet = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await TeeSheetService.createTeeSheet(
    userId as string,
    req.body as Partial<ITeeSheet>,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "TeeSheet created successfully",
    data: result,
  });
});

const showMyTournament = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;

  const result = await TeeSheetService.showMyTournament(
    req.query as any,
    userId as string,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "My tournament retrieved successfully.",
    data: result,
  });
});

const addPlayerToTeeSheet = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;

  const formData = { ...req.body };
  const result = await TeeSheetService.addPlayerToTeeSheet(
    userId as string,
    formData as any,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Add player to tee sheet successfully.",
    data: result,
  });
});

const removePlayerFromTeeSheet = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await TeeSheetService.removePlayerFromTeeSheet(
      userId as string,
      req.body as any,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Remove player from tee sheet successfully.",
      data: result,
    });
  },
);

// const showTournamentById = catchAsync(async (req: Request, res: Response) => {
//     const teesheetId = req.params.id;

//     const result = await TeeSheetService.showTournamentById(
//         teesheetId as string,
//     );

//     sendResponse(res, {
//         statusCode: StatusCodes.OK,
//         success: true,
//         message: "Tee sheet tournament retrieved successfully.",
//         data: result,
//     });
// });

const showAllTeesheetByTournamentId = catchAsync(
  async (req: Request, res: Response) => {
    const tournamentId = req.params.id;

    const result = await TeeSheetService.showAllTeesheetByTournamentId(
      tournamentId as string,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Tee sheet tournament retrieved successfully.",
      data: result,
    });
  },
);

const showTeeSheetGroupById = catchAsync(
  async (req: Request, res: Response) => {
    const groupId = req.params.id;
    const query = req.query as any;

    const result = await TeeSheetService.showTeeSheetGroupById(
      groupId as string,
      query as any,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Tee sheet group retrieved successfully.",
      data: result,
    });
  },
);

const generateGroups = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const tournamentId = req.params.id;

  const result = await TeeSheetService.generateGroups(
    tournamentId as string,
    userId as string,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tee sheet groups generated successfully.",
    data: result,
  });
});

const addPlayerToGroup = catchAsync(async (req: Request, res: Response) => {
  const teesheetId = req.params.id;
  const { id: userId } = req.user as JwtUserPayload;

  const result = await TeeSheetService.addPlayerToGroup(
    teesheetId as string,
    userId as string,
    req.body as any,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Player added to group successfully.",
    data: result,
  });
});

const removePlayerToGroup = catchAsync(async (req: Request, res: Response) => {
  const teesheetId = req.params.id;
  const { id: userId } = req.user as JwtUserPayload;

  const result = await TeeSheetService.removePlayerToGroup(
    teesheetId as string,
    userId as string,
    req.body as any,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Player removed from group successfully.",
    data: result,
  });
});

const addPlayerAuto = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;

  const result = await TeeSheetService.addPlayerAuto(
    userId as string,
    req.body as any,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Player added automatically successfully.",
    data: result,
  });
});

const movePlayer = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;

  const result = await TeeSheetService.movePlayer(
    userId as string,
    req.body as any,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Player moved successfully.",
    data: result,
  });
});

// const updateGroupWithShift = catchAsync(async (req: Request, res: Response) => {
//     const { id: userId } = req.user as JwtUserPayload;
//     const teesheetId = req.params.id;

//     const result = await TeeSheetService.updateGroupWithShift(
//         teesheetId as string,
//         userId as string,
//         req.body as any,
//     );

//     sendResponse(res, {
//         statusCode: StatusCodes.OK,
//         success: true,
//         message: "Player moved successfully.",
//         data: result,
//     });
// });

export const TeeSheetController = {
  createTeeSheet,
  showMyTournament,
  addPlayerToTeeSheet,
  removePlayerFromTeeSheet,
  // showTournamentById,
  showAllTeesheetByTournamentId,
  showTeeSheetGroupById,
  generateGroups,
  addPlayerToGroup,
  removePlayerToGroup,
  addPlayerAuto,
  movePlayer,
  // updateGroupWithShift,
};
