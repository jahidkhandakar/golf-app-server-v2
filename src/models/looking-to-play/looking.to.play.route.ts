import express from "express";
import { auth } from "./../../middlewares/auth";
import { cacheMiddleware, clearCacheMiddleware } from "../../middlewares/cacheMiddleware";
import { LookingToPlayController } from "./looking.to.play.controller";

const router = express.Router();

router.get(
    "/get-all",
    cacheMiddleware("lookingToPlay", 60),
    auth("common"),
    LookingToPlayController.showAllLookingToPlay,
);

router.post(
    "/create",
    clearCacheMiddleware("lookingToPlay"),
    auth("common"),
    LookingToPlayController.lookingToPlayCreate,
);

router.patch(
    "/update/:id",
    clearCacheMiddleware("lookingToPlay"),
    auth("common"),
    LookingToPlayController.updateLookingToPlayController,
);

router.delete(
    "/delete/:id",
    clearCacheMiddleware("lookingToPlay"),
    auth("common"),
    LookingToPlayController.deleteLookingToPlayController,
);

router.get(
    "/find/:id",
    cacheMiddleware("lookingToPlay", 60),
    auth("common"),
    LookingToPlayController.getLookingToPlayById,
);

router.post(
    "/send-invite",
    clearCacheMiddleware("lookingToPlay"),
    auth("common"),
    LookingToPlayController.sendInviteToPlay,
);




export const LookingToPlayRoutes = router;
