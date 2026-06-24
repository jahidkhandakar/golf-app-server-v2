import express from "express";
import { auth } from "./../../middlewares/auth";
import { TournamentResultController } from "./tournament.result.controller";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "../../middlewares/cacheMiddleware";

const router = express.Router();

router.get(
  "/get-all",
  cacheMiddleware("tournamentResult", 60),
  auth("common"),
  TournamentResultController.getAllTopPlayersResult,
);

router.post(
  "/create",
  clearCacheMiddleware("tournamentResult"),
  auth("superUser"),
  TournamentResultController.addTournamentResult,
);

router.patch(
  "/update/:id",
  clearCacheMiddleware("tournamentResult"),
  auth("superUser"),
  TournamentResultController.updateTournamentResult,
);

router.get(
  "/find/:id",
  cacheMiddleware("tournamentResult", 60),
  auth("common"),
  TournamentResultController.findSingleTournamentResult,
);

router.get(
  "/club/:clubId",
  cacheMiddleware("tournamentResult", 60),
  auth("common"),
  TournamentResultController.getLeaderboard,
);

router.get(
  "/tournament/all",
  cacheMiddleware("tournamentResult", 60),
  auth("common"),
  TournamentResultController.getAllTournamentResult,
);

export const TournamentResultRoutes = router;
