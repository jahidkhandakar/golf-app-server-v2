import express from "express";
import { auth } from "./../../middlewares/auth";
import { SubscriptionController } from "./subscription.controller";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "../../middlewares/cacheMiddleware";
import validateRequest from "../../shared/validateRequest";
import { SubscriptionValidation } from "./subscription.validation";

const router = express.Router();

router.get(
  "/get-all",
  cacheMiddleware("subscription", 60),
  auth("admin"),
  SubscriptionController.showAllSubscribeRequestedUser,
);

router.post(
  "/create",
  clearCacheMiddleware("subscription"),
  auth("common"),
  validateRequest(SubscriptionValidation.createSubscription),
  SubscriptionController.createSubscription,
);

router.get(
  "/cancled",
  cacheMiddleware("subscription", 60),
  auth("admin"),
  SubscriptionController.showAllSubscribeUserBlock,
);

router.put(
  "/cancled",
  clearCacheMiddleware("subscription"),
  auth("admin"),
  SubscriptionController.canceledSubscriber,
);

router.get(
  "/aproved",
  cacheMiddleware("subscription", 60),
  auth("admin"),
  SubscriptionController.showAllSubscribeUser,
);

router.put(
  "/aproved",
  clearCacheMiddleware("subscription"),
  auth("admin"),
  SubscriptionController.acceptSubscribUser,
);

export const SubscriptionRoutes = router;
