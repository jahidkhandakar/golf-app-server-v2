import express from "express";
import { auth } from "./../../middlewares/auth";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "./../../middlewares/cacheMiddleware";
import { NotificatioController } from "./notification.controller";

const router = express.Router();

router.get(
  "/get-all",
  auth("common"),
  cacheMiddleware("invitation", 60),
  NotificatioController.getAllNotifaction,
);

router.patch(
  "/mark-as-read",
  auth("common"),
  clearCacheMiddleware("invitation"),
  NotificatioController.markAsRead,
);

export const NotificationRoutes = router;
