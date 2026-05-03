import { Category } from "./category.model";
import AppError from "./../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { ICategory } from "./category.interface";

const createCategory = async (payload: Partial<ICategory>) => {
  const isExist = await Category.findOne({ name: payload.name });
  if (isExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Category already exists");
  }

  const result = await Category.create(payload);
  return result;
};

const getAllCategories = async () => {
  const result = await Category.find().sort({ createdAt: -1 });
  return result;
};

const deleteCategory = async (id: string) => {
  const result = await Category.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  }
  return result;
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  deleteCategory,
};
