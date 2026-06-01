import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { JwtUserPayload } from "../../middlewares/auth";
import { LookingToPlayService } from "./looking.to.play.service";

const lookingToPlayCreate = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await LookingToPlayService.lookingToPlayCreate(
        userId,
        req.body,
    );

    // Return success response
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "looking to played created successfully",
        data: result,
    })
});

const showAllLookingToPlay = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    // Call service
    const result =
        await LookingToPlayService.showAllLookingToPlay(userId as string, req.query as any);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "looking to played show all successfully",
        data: result,
    });
});

const updateLookingToPlayController = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await LookingToPlayService.updateLookingToPlay(
        userId as string,
        req.params.id as string,
        req.body as any,
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Updated successfully",
        data: result,
    })
});

const deleteLookingToPlayController = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await LookingToPlayService.deleteLookingToPlay(userId as string, req.params.id as string);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Deleted successfully",
        data: result,
    })
});

const getLookingToPlayById = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;
    const lookingToPlayId = req.params.id;

    const result = await LookingToPlayService.getLookingToPlayById(
        lookingToPlayId as string,
        userId as string,
    );

    // Return success response
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "looking to played show all successfully",
        data: result,
    });
});

const sendInviteToPlay = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;
    const payload = req.body;

    const result = await LookingToPlayService.sendInviteToPlay(payload as any, userId as string);

    // Return success response
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Invite sent successfully",
        data: result,
    });
});



export const LookingToPlayController = {
    lookingToPlayCreate,
    showAllLookingToPlay,
    updateLookingToPlayController,
    deleteLookingToPlayController,
    getLookingToPlayById,
    sendInviteToPlay,
}