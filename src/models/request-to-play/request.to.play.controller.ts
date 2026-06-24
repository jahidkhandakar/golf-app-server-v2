import { StatusCodes } from "http-status-codes";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import { RequestToPlayService } from "./request.to.play.service";

const makeRequestToplay = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const { id: tournamentId } = req.params;
  const { challengedUser } = req.body;

  // console.log("tournamentId", tournamentId);

  const result = await RequestToPlayService.makeRequestToplay(
    userId as string,
    tournamentId as string,
    challengedUser as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "make the request succefully",
    data: result,
  });
});

const showAllrequestedtournament = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await RequestToPlayService.showAllrequestedtournament(
      userId as string,
      req.query as any,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Requested tournament retrieved successfully",
      data: result,
    });
  },
);

const showAllUserRequestedtournament = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await RequestToPlayService.showAllUserRequestedtournament(
      userId as string,
      req.query as any,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Requested tournament retrieved successfully",
      data: result,
    });
  },
);

const findAvailablePlayerForTournament = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;
    const tournamentId = req.params.id;

    const result = await RequestToPlayService.findAvailablePlayerForTournament(
      tournamentId as string,
      userId as string,
      req.query as any,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "available player for tournament",
      data: result,
    });
  },
);

const showAllRequiestedTouranamentById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await RequestToPlayService.showrequestDetalsById(
      id as string,
    );

    // Return the success response
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "make the request succefully",
      data: result,
    });
  },
);

// aproved the user the who requested for the play
//--------------------------------------------------------------------------------
const aprovedTheRequest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id: userId } = req.user as JwtUserPayload;
  const { approveUserId } = req.body;
  const result = await RequestToPlayService.aprovedTheRequest(
    id as string,
    userId as string,
    approveUserId as string,
  );

  // Return the success response
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "make the request aproved ",
    data: result,
  });
});

const aprovedTheRequestThrowNotification = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { id: userId } = req.user as JwtUserPayload;
    const { approveUserId } = req.body;
    const result =
      await RequestToPlayService.aprovedTheRequestThrowNotification(
        id as string,
        userId as string,
        approveUserId as string,
      );

    // Return the success response
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "make the request aproved ",
      data: result,
    });
  },
);

// aproved the user the who requested for the play
//--------------------------------------------------------------------------------
const cancelRequest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id: userId } = req.user as JwtUserPayload;
  const { rejectUserId } = req.body;
  const result = await RequestToPlayService.cancelRequest(
    id as string,
    userId as string,
    rejectUserId as string,
  );
  // Return the success response
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "tournament creator are cancel your request ",
    data: result,
  });
});

// const showTeeSheetGroupById = catchAsync(async (req, res) => {
//     const { id } = req.params;
//     const { id: userId } = req.user as JwtUserPayload;
//     const result = await RequestToPlayService.showTeeSheetGroupById(id as string, userId as string);

//     sendResponse(res, {
//         statusCode: StatusCodes.OK,
//         success: true,
//         message: "Invitation accepted successfully",
//         data: result,
//     });
// });

export const RequestToPlayController = {
  makeRequestToplay,
  showAllUserRequestedtournament,
  findAvailablePlayerForTournament,
  showAllrequestedtournament,
  showAllRequiestedTouranamentById,
  aprovedTheRequest,
  aprovedTheRequestThrowNotification,
  cancelRequest,
  // showTeeSheetGroupById,
};
