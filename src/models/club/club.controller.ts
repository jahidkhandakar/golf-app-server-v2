import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ClubService } from "./club.service";
import { StatusCodes } from "http-status-codes";


const getAllClubs = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await ClubService.getAllClubs(req.query as any, userId as string);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Clubs retrieved successfully.",
        data: result,
    });
});

const getMyClubs = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const result = await ClubService.getMyClubs(req.query as any, userId);



    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Clubs retrieved successfully.",
        data: result,
    });
});

const createClub = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;

    const clubLogo: any = {};

    if (req.file) {
        clubLogo.url = "/uploads/" + req.file.filename;
        clubLogo.path = req.file.path;
    }
    if (req.file) {
        req.body.clubLogo = clubLogo;
    }

    const result = await ClubService.createClub(req.body as any, userId as string);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Clubs created successfully.",
        data: result,
    });
});

const showClubById = catchAsync(async (req: Request, res: Response) => {
    const clubId = req.params.clubId;
    const { id: userId } = req.user as JwtUserPayload;


    const result = await ClubService.showClubById(clubId as string, userId as string);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Club retrieved successfully.",
        data: result,
    });
});

const updateClub = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;
    const clubId = req.params.clubId;

    const result = await ClubService.updateClub(clubId as string, req.body as any, userId as string);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Club updated successfully.",
        data: result,
    });
});

const requestToJoinClub = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;
    const clubId = req.params.clubId;

    const result = await ClubService.requestToJoinClub(clubId as string, userId as string);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Request to Join Club",
        data: result,
    });
});

const acceptedRequestToJoinClub = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;
    const clubId = req.params.clubId;
    const { joinUserId } = req.body;

    const result = await ClubService.acceptedRequestToJoinClub(
        clubId as string,
        userId as string,
        joinUserId as string,
    );
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Request to Join Club Accepted",
        data: result,
    });
});

const getPendingUsers = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;
    const clubId = req.params.clubId;

    const result = await ClubService.getPendingUsers(
        clubId as string,
        userId as string,
        req.query as any,
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Pending Users Retrieved",
        data: result,
    });
});

const getJoinedUsers = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;
    const clubId = req.params.clubId;

    const result = await ClubService.getJoinedUsers(
        clubId as string,
        req.query as any,
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Joined Users Retrieved",
        data: result,
    });
});

const rejectRequestToJoinClub = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user as JwtUserPayload;
    const clubId = req.params.clubId;
    const { rejectedUserId } = req.body;

    const result = await ClubService.rejectRequestToJoinClub(
        clubId as string,
        userId as string,
        rejectedUserId as string,
    );
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Request to Join Club Rejected",
        data: result,
    });
});

export const ClubController = {
    getAllClubs,
    getMyClubs,
    createClub,
    showClubById,
    requestToJoinClub,
    updateClub,
    acceptedRequestToJoinClub,
    getPendingUsers,
    rejectRequestToJoinClub,
    getJoinedUsers,
};
