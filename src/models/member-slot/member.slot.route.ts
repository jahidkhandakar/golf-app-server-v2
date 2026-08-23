import express from "express";
import { auth } from "../../middlewares/auth";
import { redemptionLimiter } from "../../middlewares/rateLimiters";
import { MemberSlotController } from "./member.slot.controller";

const router = express.Router();

// Redeeming a code is a plain authenticated action; must precede "/:id/..."
// so "join-private" isn't captured as a club id. Rate-limited (5 tries then
// cooldown) as brute-force protection on the access code (spec §12).
router.post(
  "/join-private",
  auth("common"),
  redemptionLimiter,
  MemberSlotController.joinPrivate,
);

// Creator / sub-admin slot management (club-scoped staff enforced in service).
router.post("/:id/slots", auth("common"), MemberSlotController.createSlot);
router.get("/:id/slots", auth("common"), MemberSlotController.listSlots);

// Creator-only, one-way conversion.
router.post(
  "/:id/convert-to-public",
  auth("common"),
  MemberSlotController.convertToPublic,
);

export const MemberSlotRoutes = router;
