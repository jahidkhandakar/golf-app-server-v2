import express from "express";
import { auth } from "./../../middlewares/auth";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "../../middlewares/cacheMiddleware";
import { SubscribeController } from "./subscribe.controller";

const router = express.Router();

router.get(
  "/get-all",
  cacheMiddleware("sponsored", 60),
  auth("common"),
  SubscribeController.showSubscribe,
);

router.put(
  "/create",
  clearCacheMiddleware("sponsored"),
  auth("admin"),
  // validateRequest(SubscribeValidation.createSubscribe),
  SubscribeController.createSubscribe,
);

router.patch(
  "/update/:id",
  clearCacheMiddleware("sponsored"),
  auth("admin"),
  SubscribeController.updateSubscribe,
);

export const SubscribeRoutes = router;
