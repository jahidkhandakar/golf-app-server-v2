import express from "express";
import { auth } from "./../../middlewares/auth";
import { TournamentResultController } from "./tournament.result.controller";
import { SideGamesController } from "./side.games.controller";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "../../middlewares/cacheMiddleware";
import { submissionLimiter } from "../../middlewares/rateLimiters";

const router = express.Router();

// ── Live side games (authoritative engine) ──────────────────────────────
// Staff enters per-hole scores; anyone in the event can read the live board.
// Club-scoped staff authorization is enforced in the service.
router.post(
  "/:tournamentId/score-entry",
  clearCacheMiddleware("tournamentResult"),
  auth("common"),
  submissionLimiter,
  SideGamesController.enterHoleScores,
);

router.get(
  "/:tournamentId/live-side-games",
  auth("common"),
  SideGamesController.getLiveSideGames,
);

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
