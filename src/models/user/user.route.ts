import express from "express";
import { UserController } from "./user.controller";
import { auth } from "./../../middlewares/auth";
import validateRequest from "./../../shared/validateRequest";
import { multiUploadHandler } from "./../../middlewares/fileUploadHandler";
import { userValidation } from "./user.validation";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "./../../middlewares/cacheMiddleware";

const router = express.Router();

router.get(
  "/get-all",
  auth("admin", "user"),
  cacheMiddleware("users", 60),
  UserController.getAll,
);

router.get(
  "/find/:id",
  auth("admin", "user"),
  cacheMiddleware("users", 60),
  UserController.getSingleUser,
);

router.patch(
  "/update-my-profile",
  auth("admin", "user"),
  clearCacheMiddleware("users"),
  multiUploadHandler([{ name: "profile", maxCount: 1 }]),
  UserController.updateMyProfile,
);

router.get(
  "/get-my-profile",
  auth("admin", "user"),
  cacheMiddleware("users", 60),
  UserController.getMyProfile,
);

router.patch(
  "/delete/my-account",
  auth("admin", "user"),
  clearCacheMiddleware("users"),
  UserController.softDeleteUser,
);

router.delete(
  "/delete/:id",
  auth("admin"),
  clearCacheMiddleware("users"),
  UserController.deleteUser,
);

router.patch(
  "/change-status/:id",
  auth("admin"),
  clearCacheMiddleware("users"),
  validateRequest(userValidation.changeUserStatus),
  UserController.changeUserStatus,
);

export const UserRoutes = router;
