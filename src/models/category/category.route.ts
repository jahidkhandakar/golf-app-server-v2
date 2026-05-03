import express from "express";
import { CategoryController } from "./category.controller";
import { auth } from "./../../middlewares/auth";
import validateRequest from "./../../shared/validateRequest";
import { categoryValidation } from "./category.validation";

const router = express.Router();

router.post(
  "/",
  auth("admin"),
  validateRequest(categoryValidation.createCategory),
  CategoryController.createCategory
);

router.get("/", CategoryController.getAllCategories);

router.delete("/:id", auth("admin"), CategoryController.deleteCategory);

export const CategoryRoutes = router;
