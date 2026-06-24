import express from "express";
import { auth } from "./../../middlewares/auth";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "../../middlewares/cacheMiddleware";
import { TeeSheetController } from "./tee.sheet.controller";

const router = express.Router();

router.get(
  "/my-tournament",
  cacheMiddleware("teesheet", 60),
  auth("common"),
  TeeSheetController.showMyTournament,
);

// router.get(
//     "/tournament/:id",
//     cacheMiddleware("teesheet", 60),
//     auth("common"),
//     TeeSheetController.showTournamentById,
// );

router.get(
  "/find/:id",
  cacheMiddleware("teesheet", 60),
  auth("common"),
  TeeSheetController.showAllTeesheetByTournamentId,
);

router.post(
  "/add-player",
  clearCacheMiddleware("teesheet"),
  auth("common"),
  // validateRequest(TeeSheetValidation.addPlayerToTeeSheet),
  TeeSheetController.addPlayerToTeeSheet,
);

router.post(
  "/remove-player",
  clearCacheMiddleware("teesheet"),
  auth("common"),
  // validateRequest(TeeSheetValidation.removePlayerFromTeeSheet),
  TeeSheetController.removePlayerFromTeeSheet,
);

router.get(
  "/get-group/:id",
  cacheMiddleware("teesheet", 60),
  auth("common"),
  TeeSheetController.showTeeSheetGroupById,
);

router.post(
  "/generate/:id",
  clearCacheMiddleware("teesheet"),
  auth("common"),
  TeeSheetController.generateGroups,
);

router.post(
  "/add-player/group/:id",
  clearCacheMiddleware("teesheet"),
  auth("common"),
  TeeSheetController.addPlayerToGroup,
);

router.patch(
  "/remove-player/group/:id",
  clearCacheMiddleware("teesheet"),
  auth("common"),
  TeeSheetController.removePlayerFromTeeSheet,
);

router.post(
  "/add-auto",
  clearCacheMiddleware("teesheet"),
  auth("common"),
  TeeSheetController.addPlayerAuto,
);

router.post(
  "/move-player",
  clearCacheMiddleware("teesheet"),
  auth("common"),
  TeeSheetController.movePlayer,
);

// router.patch(
//     "/update-group/:id",
//     clearCacheMiddleware("teesheet"),
//     auth("common"),
//     TeeSheetController.updateGroupWithShift,
// );

export const TeeSheetRoutes = router;
