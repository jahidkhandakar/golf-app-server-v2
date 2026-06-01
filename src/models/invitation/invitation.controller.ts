import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse";
import { JwtUserPayload } from "../../middlewares/auth";
import { InvitationService } from "./invitation.service";



const getMyInvitationsController = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await InvitationService.getMyInvitations(req.query as any, userId as string);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Invitations retrieved successfully",
        data: result,
    });
});

const acceptInvitationController = catchAsync(async (req, res) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await InvitationService.acceptInvitation(
        userId as string,
        req.params.id as string,
    );
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Invitation accepted successfully",
        data: result,
    });
});

const rejectInvitationController = catchAsync(async (req, res) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await InvitationService.rejectInvitation(
        userId as string,
        req.params.id as string,
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Invitation rejected successfully",
        data: result,
    });
});


export const InvitationController = {
    getMyInvitationsController,
    acceptInvitationController,
    rejectInvitationController,
}