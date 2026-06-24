import express from "express";
import { auth } from "./../../middlewares/auth";
import validateRequest from "./../../shared/validateRequest";
import { multiUploadHandler } from "./../../middlewares/fileUploadHandler";
import { ClubController } from "./club.controller";
import { ClubValidation } from "./club.validation";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "../../middlewares/cacheMiddleware";

const router = express.Router();

router.get(
  "/get-all",
  cacheMiddleware("club", 60),
  auth("common"),
  ClubController.getAllClubs,
);

router.get(
  "/my-club",
  cacheMiddleware("club", 60),
  auth("common"),
  ClubController.getMyClubs,
);

router.post(
  "/create",
  clearCacheMiddleware("club"),
  auth("superUser"),
  multiUploadHandler([{ name: "clubLogo", maxCount: 1 }]),
  validateRequest(ClubValidation.createClub),
  ClubController.createClub,
);

router.patch(
  "/update/:clubId",
  clearCacheMiddleware("club"),
  auth("superUser"),
  multiUploadHandler([{ name: "clubLogo", maxCount: 1 }]),
  validateRequest(ClubValidation.createClub),
  ClubController.updateClub,
);

router.get(
  "/find/:clubId",
  cacheMiddleware("club", 60),
  auth("common"),
  ClubController.showClubById,
);

router.patch(
  "/request-to-join/:clubId",
  clearCacheMiddleware("club"),
  auth("common"),
  ClubController.requestToJoinClub,
);

router.patch(
  "/accepted-request-to-join/:clubId",
  clearCacheMiddleware("club"),
  auth("superUser"),
  ClubController.acceptedRequestToJoinClub,
);

router.patch(
  "/reject-request-to-join/:clubId",
  clearCacheMiddleware("club"),
  auth("superUser"),
  ClubController.rejectRequestToJoinClub,
);

router.get(
  "/pending-users/:clubId",
  cacheMiddleware("club", 60),
  auth("superUser"),
  ClubController.getPendingUsers,
);

router.get(
  "/joined-users/:clubId",
  cacheMiddleware("club", 60),
  auth("superUser"),
  ClubController.getJoinedUsers,
);

export const ClubRoutes = router;
