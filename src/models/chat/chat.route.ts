import express from "express";
import { auth } from "./../../middlewares/auth";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "./../../middlewares/cacheMiddleware";
import { ChatController } from "./chat.controller";

const router = express.Router();

router.get(
  "/my-chat",
  auth("common"),
  cacheMiddleware("chat", 60),
  ChatController.showMyChat,
);

router.post(
  "/create/single",
  auth("common"),
  clearCacheMiddleware("chat"),
  ChatController.createsingleChat,
);

router.post(
  "/create/group",
  auth("common"),
  clearCacheMiddleware("chat"),
  ChatController.createGroupChat,
);

export const ChatRoutes = router;
