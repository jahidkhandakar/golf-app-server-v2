import express from "express";
import { auth } from "./../../middlewares/auth";
import { cacheMiddleware, clearCacheMiddleware } from "./../../middlewares/cacheMiddleware";
import { InvitationController } from "./invitation.controller";

const router = express.Router();

router.get(
    "/all",
    auth("common"),
    cacheMiddleware("invitation", 60),
    InvitationController.getMyInvitationsController,
);

router.patch(
    "/accept/:id",
    auth("common"),
    clearCacheMiddleware("invitation"),
    InvitationController.acceptInvitationController,
);

router.patch(
    "/reject/:id",
    auth("common"),
    clearCacheMiddleware("invitation"),
    InvitationController.rejectInvitationController,
);

export const InvitationRoutes = router;
