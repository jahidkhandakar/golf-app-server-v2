/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from "./user.model";
import AppError from "./../../errors/AppError";
import { StatusCodes } from "http-status-codes";

const getAll = async (query: any) => {
  const { search, date, page = 1, limit = 10 } = query;

  const filter: any = {
    role: ["parent", "teen"],
  };

  if (search) {
    const trimSearch = search.trim();
    filter.fullName = { $regex: trimSearch, $options: "i" };
    filter.email = { $regex: trimSearch, $options: "i" };
  }

  if (date) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);

    filter.created_at = { $gte: start, $lte: end };
  }

  const skip = (page - 1) * limit;

  const users = await User.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ created_at: -1 })
    .lean();

  const totalUsers = await User.countDocuments(filter);

  if (users.length === 0) {
    return [];
  }
  return {
    meta: {
      totalResult: totalUsers,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalUsers / limit),
    },
    results: users,
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
