import express from "express";
import { auth } from "./../../middlewares/auth";
import validateRequest from "./../../shared/validateRequest";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "../../middlewares/cacheMiddleware";
import { TournamentValidation } from "./tournament.validation";
import { TournamentController } from "./tournament.controller";

const router = express.Router();

router.post(
  "/create",
  clearCacheMiddleware("tournament"),
  auth("common"),
  // [uploadUsers.single("tournamentImage")],
  // convertHeicToPngMiddleware(UPLOADS_FOLDER_USERS),

  validateRequest(TournamentValidation.createTournament),
  TournamentController.createTournament,
);

router.get(
  "/getAll-tournament",
  cacheMiddleware("tournament", 60),
  auth("common"),
  TournamentController.getTournaments,
);

router.get(
  "/get-all/my-tournament",
  cacheMiddleware("tournament", 60),
  auth("common"),
  TournamentController.getAllMyTournamentCommon,
);

// dev branch
router.get(
  "/get-all",
  auth("common"),
  clearCacheMiddleware("tournament"),
  TournamentController.getAllTournament,
);

router.get(
  "/get-all/complete",
  cacheMiddleware("tournament", 60),
  auth("common"),
  TournamentController.getAllCompleteTournament,
);

router.get(
  "/my-tournament-all",
  cacheMiddleware("tournament", 60),
  auth("common"),
  TournamentController.getMyAllTournament,
);

router.get(
  "/get/all-entered",
  cacheMiddleware("tournament", 60),
  auth("common"),
  TournamentController.getAllEnteredTournaments,
);

router.get(
  "/find/:tournamentId",
  cacheMiddleware("tournament", 60),
  auth("common"),
  TournamentController.getTournamentFindById,
);

// for the admin
//------------------------------------
router.get(
  "/admin-controle",
  cacheMiddleware("tournament", 60),
  auth("admin"),
  TournamentController.showAllMyTournanmnetForRequest,
);

router.get(
  "/admin-approved",
  cacheMiddleware("tournament", 60),
  auth("admin"),
  TournamentController.showallAprovedTourmant,
);

router.put(
  "/admin-approved",
  clearCacheMiddleware("tournament"),
  auth("admin"),
  TournamentController.showAllTournanmnetForRequestAproved,
);

router.get(
  "/admin-cancled",
  cacheMiddleware("tournament", 60),
  auth("admin"),
  TournamentController.showallRejectTourmant,
);

router.put(
  "/admin-cancled",
  clearCacheMiddleware("tournament"),
  auth("admin"),
  TournamentController.showAllMyTournanmnetForRequestRejected,
);

router.patch(
  "/update/:tournamentId",
  clearCacheMiddleware("tournament"),
  auth("common"),
  // [uploadUsers.single("tournamentImage")],
  TournamentController.updateTournament,
);
router.delete(
  "/delete/:id",
  clearCacheMiddleware("tournament"),
  auth("common"),
  TournamentController.deleteTournament,
);

router.patch(
  "/update/:id",
  clearCacheMiddleware("tournament"),
  auth("common"),
  // [uploadUsers.single("tournamentImage")],
  // convertHeicToPngMiddleware(UPLOADS_FOLDER_USERS),
  TournamentController.updateTournament,
);

router.patch(
  "/makerequest-toplay",
  clearCacheMiddleware("tournament"),
  auth("common"),
  TournamentController.makeRequestToPlay,
);

router.get(
  "/get-all-users/:id",
  cacheMiddleware("tournament", 60),
  auth("common"),
  TournamentController.getAllUsersInTournament,
);

export const TournamentRoutes = router;
