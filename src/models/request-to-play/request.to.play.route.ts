import express from "express";
import { auth } from "./../../middlewares/auth";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "./../../middlewares/cacheMiddleware";
import { RequestToPlayController } from "./request.to.play.controller";

const router = express.Router();

router.get(
  "/get-all",
  auth("common"),
  cacheMiddleware("requestToPlay", 60),
  RequestToPlayController.showAllrequestedtournament,
);

router.get(
  "/find-all-users",
  auth("common"),
  cacheMiddleware("requestToPlay", 60),
  RequestToPlayController.showAllUserRequestedtournament,
);

router.get(
  "/find-available-player/:id",
  auth("common"),
  cacheMiddleware("requestToPlay", 60),
  RequestToPlayController.findAvailablePlayerForTournament,
);

router.get(
  "/find/:id",
  auth("common"),
  cacheMiddleware("requestToPlay", 60),
  RequestToPlayController.showAllRequiestedTouranamentById,
);

router.patch(
  "/make-request/:id",
  auth("common"),
  clearCacheMiddleware("requestToPlay"),
  RequestToPlayController.makeRequestToplay,
);

router.patch(
  "/approve/:id",
  auth("common"),
  clearCacheMiddleware("requestToPlay"),
  RequestToPlayController.aprovedTheRequest,
);

router.patch(
  "/cancel/:id",
  auth("common"),
  clearCacheMiddleware("requestToPlay"),
  RequestToPlayController.cancelRequest,
);

router.patch(
  "/approve-notification/:id",
  auth("common"),
  clearCacheMiddleware("requestToPlay"),
  RequestToPlayController.aprovedTheRequestThrowNotification,
);

export const RequestToPlayRoutes = router;
