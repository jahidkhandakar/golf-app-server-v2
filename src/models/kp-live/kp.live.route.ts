import express from "express";
import { auth } from "../../middlewares/auth";
import { multiUploadHandler } from "../../middlewares/fileUploadHandler";
import { submissionLimiter } from "../../middlewares/rateLimiters";
import { KpLiveController } from "./kp.live.controller";

const router = express.Router();

// First group pins the KP hole; any group in the event can read the pins to
// arm the 40-yard geofence popup.
router.post("/:id/kp-pin", auth("common"), KpLiveController.pinHole);
router.get("/:id/kp-pins", auth("common"), KpLiveController.getPins);

// Record an entry (the acting user is the measurer). Two AR-captured photos are
// uploaded to S3 by the handler; the service enforces the strict-beat rule.
router.post(
  "/:id/kp-entry",
  auth("common"),
  submissionLimiter,
  multiUploadHandler([{ name: "photos", maxCount: 2 }]),
  KpLiveController.submitEntry,
);

// Ordered board for a hole+category (leader first). Query: hole, category,
// isLongDrive.
router.get("/:id/kp-board", auth("common"), KpLiveController.getBoard);

// Current leaders across all holes (become official at Final unless overridden).
router.get("/:id/kp-leaders", auth("common"), KpLiveController.getLeaders);

// Staff removal of a disputed entry.
router.delete(
  "/:id/kp-entry/:entryId",
  auth("common"),
  KpLiveController.deleteEntry,
);

export const KpLiveRoutes = router;
