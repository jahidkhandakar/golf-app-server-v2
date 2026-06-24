import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { UserService } from "./user.service";
import { uploadToS3 } from "./../../middlewares/fileUploadHandler";
import { UserStatus } from "./user.constant";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "./user.model";
import { JwtUserPayload } from "../../middlewares/auth";

const getAll = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAll(req.query as any);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users retrieved successfully.",
    data: result,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.params;
  const result = await UserService.getSingleUser(userId as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Single user fetched successfully.",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await UserService.getMyProfile(userId as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "My profile retrieved successfully.",
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.params;
  const result = await UserService.deleteUser(userId as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User deleted successfully.",
    data: result,
  });
});

const softDeleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await UserService.softDeleteUser(userId as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User deleted successfully.",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const userData = { ...req.body };

  const existingUser = await User.findById(userId).lean();
  if (!existingUser)
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  const files = req.files as {
    profile?: Express.Multer.File[];
  };

  if (files?.profile?.[0]) {
    userData.image = await uploadToS3(files.profile[0]);
  }

  // Prevent role changes
  delete userData.role;

  const result = await UserService.updateMyProfile(userId, userData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const changeUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.params;
  const { status } = req.body;
  const result = await UserService.changeUserStatus(
    userId as string,
    status as UserStatus,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User status changed successfully.",
    data: result,
  });
});

export const UserController = {
  getAll,
  getSingleUser,
  getMyProfile,
  updateMyProfile,
  deleteUser,
  softDeleteUser,
  changeUserStatus,
};
