import express from "express";
import { auth } from "./../../middlewares/auth";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "../../middlewares/cacheMiddleware";
import { SponsoredTournamentController } from "./sponsored.tournament.controller";

const router = express.Router();

router.get(
  "/get-all",
  cacheMiddleware("sponsored", 60),
  auth("common"),
  SponsoredTournamentController.showAllsponserTournament,
);

router.post(
  "/create",
  clearCacheMiddleware("sponsored"),
  auth("superUser"),
  // multiUploadHandler([{ name: "clubLogo", maxCount: 1 }]),
  // validateRequest(ClubValidation.createClub),
  SponsoredTournamentController.createSponserTournament,
);

router.patch(
  "/update/:id",
  clearCacheMiddleware("sponsored"),
  auth("superUser"),
  // multiUploadHandler([{ name: "clubLogo", maxCount: 1 }]),
  SponsoredTournamentController.updateSponserTournament,
);

export const SponsoredTournamentRoutes = router;
