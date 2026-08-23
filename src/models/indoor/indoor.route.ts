import express from "express";
import { auth } from "../../middlewares/auth";
import { IndoorController } from "./indoor.controller";

const router = express.Router();

// Leagues
router.post("/leagues", auth("common"), IndoorController.createLeague);
router.get("/leagues", auth("common"), IndoorController.listLeagues);
router.get("/leagues/:id", auth("common"), IndoorController.getLeague);
router.get(
  "/leagues/:id/standings",
  auth("common"),
  IndoorController.getStandings,
);

// Rounds + witness
router.post(
  "/leagues/:id/rounds",
  auth("common"),
  IndoorController.submitRound,
);
router.patch(
  "/rounds/:roundId/verify",
  auth("common"),
  IndoorController.verifyWitness,
);
router.patch(
  "/leagues/:id/rounds/:roundId/override",
  auth("common"),
  IndoorController.creatorOverride,
);

// Flights (creator)
router.patch(
  "/leagues/:id/flights",
  auth("common"),
  IndoorController.setFlights,
);

// Sim sessions (sim board + Sim Social Rounds)
router.post("/sessions", auth("common"), IndoorController.createSession);
router.get("/sessions", auth("common"), IndoorController.listSessions);
router.get("/sessions/:id", auth("common"), IndoorController.getSession);
router.patch(
  "/sessions/:id/assign-bay",
  auth("common"),
  IndoorController.assignBay,
);
router.post(
  "/sessions/:id/check",
  auth("common"),
  IndoorController.recordCheck,
);

export const IndoorRoutes = router;
