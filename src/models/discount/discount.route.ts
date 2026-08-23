import express from "express";
import { auth } from "../../middlewares/auth";
import { adminAuth } from "../../middlewares/adminAuth";
import { redemptionLimiter } from "../../middlewares/rateLimiters";
import { DiscountController } from "./discount.controller";

const router = express.Router();

// User-facing: redeem a code, or earn one via the social-post flow. Redemption
// is rate-limited to blunt brute-force guessing (spec §12).
router.post(
  "/redeem",
  auth("common"),
  redemptionLimiter,
  DiscountController.redeem,
);
router.post(
  "/earn",
  auth("common"),
  redemptionLimiter,
  DiscountController.earn,
);

// Billing controls behind the SEPARATE App-Admin identity (spec §16) — creator
// logins never reach these.
router.get("/codes", adminAuth, DiscountController.listCodes);
router.get("/audit", adminAuth, DiscountController.listAudit);
router.post("/comp", adminAuth, DiscountController.mintComp);
router.post("/campaign", adminAuth, DiscountController.mintCampaign);
router.post("/import-store", adminAuth, DiscountController.importStoreCode);
router.post("/grant-comp", adminAuth, DiscountController.grantComp);
router.delete("/codes/:id", adminAuth, DiscountController.revokeCode);

export const DiscountRoutes = router;
