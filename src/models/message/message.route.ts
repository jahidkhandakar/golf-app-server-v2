import express from "express";
import { auth } from "./../../middlewares/auth";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "./../../middlewares/cacheMiddleware";
import { MessageController } from "./message.controller";

const router = express.Router();

router.get(
  "/get-my-message",
  auth("common"),
  cacheMiddleware("chat", 60),
  MessageController.showMyChatMessage,
);

router.post(
  "/create",
  auth("common"),
  clearCacheMiddleware("chat"),
  // [uploadUsers.single("image")],
  // convertHeicToPngMiddleware(UPLOADS_FOLDER_USERS),
  MessageController.sendImage,
);

export const MessageRoutes = router;
