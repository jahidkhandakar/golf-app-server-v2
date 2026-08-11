import express from "express";
import { auth } from "../../middlewares/auth";
import { RosterController } from "./roster.controller";

const router = express.Router();

// Any authenticated user can join standby; staff promote / mark no-show
// (club-scoped staff authorization is enforced in the service).
router.post("/:id/standby", auth("common"), RosterController.joinStandby);
router.post("/:id/promote/:userId", auth("common"), RosterController.promote);
router.post("/:id/no-show/:userId", auth("common"), RosterController.noShow);

export const RosterRoutes = router;
