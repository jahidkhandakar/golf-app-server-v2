/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from "./user.model";
import AppError from "./../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { queueNotification } from "../../notifications/notification.queue";
import QueryBuilder from "../../shared/queryBuilder";
import { IUser } from "./user.interface";

const getAll = async (query: any) => {
  const filter: any = { ...query, isDeleted: false };

  const userQuery = new QueryBuilder<IUser>(User.find(), filter)
    .search(["name", "email", "role", "status"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const results = await userQuery.modelQuery.select("-isDeleted -__v").lean();

  const meta = await userQuery.countTotal();

  return {
    meta,
    results,
  };
};

const getSingleUser = async (userId: string) => {
  const user = await User.findById(userId).lean();

  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  return user;
};

const getMyProfile = async (userId: string) => {
  const user = await User.findById(userId).lean();
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  return user;
};

const softDeleteUser = async (userId: string) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { status: "deleted" },
    { new: true },
  ).lean();
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  return user;
};

const deleteUser = async (userId: string) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  return user;
};

const updateMyProfile = async (userId: string, payload: any) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: payload },
    { new: true, runValidators: true },
  ).lean();

  if (user) {
    await queueNotification({
      userId: user._id.toString(),
      title: "Profile Updated",
      message: "Your profile has been updated successfully.",
      channels: ["in-app"], // Using socket notification
    });
  }

  return user;
};

const changeUserStatus = async (userId: string, status: string) => {
  const user = await User.findByIdAndUpdate(userId, { status }, { new: true });
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  return user;
};

export const UserService = {
  getAll,
  getSingleUser,
  getMyProfile,
  deleteUser,
  softDeleteUser,
  updateMyProfile,
  changeUserStatus,
};
