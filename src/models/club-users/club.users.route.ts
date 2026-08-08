import express from "express";
import { auth } from "../../middlewares/auth";
import { ClubUsersController } from "./club.users.controller";

const router = express.Router();

// Club-scoped role of the caller. Authorization for staff actions is enforced
// per-club in the service (via Club.createdBy + ClubUser.role), so these use
// "common" access rather than a global role gate.
router.get("/role/:clubId", auth("common"), ClubUsersController.getMyClubRole);

router.patch(
  "/sub-admin/:clubId",
  auth("common"),
  ClubUsersController.setSubAdmin,
);

export const ClubUsersRoutes = router;
