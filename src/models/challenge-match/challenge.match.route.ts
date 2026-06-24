import express from "express";
import { auth } from "./../../middlewares/auth";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "./../../middlewares/cacheMiddleware";
import { ChallengeMatchController } from "./challenge.match.controller";

const router = express.Router();

router.get(
  "/find/:id",
  auth("common"),
  cacheMiddleware("challengeMatch", 60),
  ChallengeMatchController.getChallengeMatches,
);

router.post(
  "/create/:id",
  auth("common"),
  clearCacheMiddleware("challengeMatch"),
  ChallengeMatchController.createChallengeMatch,
);

router.patch(
  "/complete-tournament/:id",
  auth("common"),
  clearCacheMiddleware("challengeMatch"),
  ChallengeMatchController.completeTournament,
);

router.patch(
  "/update/:id",
  auth("common"),
  clearCacheMiddleware("challengeMatch"),
  ChallengeMatchController.updateChallengeMatches,
);

router.delete(
  "/delete/:id",
  auth("common"),
  clearCacheMiddleware("challengeMatch"),
  ChallengeMatchController.deleteChallengeMatch,
);

export const ChallengeMatchRoutes = router;
