import express from "express";
import { auth } from "../../middlewares/auth";
import { DiscountController } from "./discount.controller";

const router = express.Router();

// User-facing: redeem a code, or earn one via the social-post flow.
router.post("/redeem", auth("common"), DiscountController.redeem);
router.post("/earn", auth("common"), DiscountController.earn);

// Admin-only billing controls + the one discount dashboard + audit log.
router.get("/codes", auth("admin"), DiscountController.listCodes);
router.get("/audit", auth("admin"), DiscountController.listAudit);
router.post("/comp", auth("admin"), DiscountController.mintComp);
router.post("/campaign", auth("admin"), DiscountController.mintCampaign);
router.post("/import-store", auth("admin"), DiscountController.importStoreCode);
router.post("/grant-comp", auth("admin"), DiscountController.grantComp);
router.delete("/codes/:id", auth("admin"), DiscountController.revokeCode);

export const DiscountRoutes = router;
