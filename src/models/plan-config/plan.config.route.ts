import express from "express";
import { auth } from "../../middlewares/auth";
import { adminAuth } from "../../middlewares/adminAuth";
import { PlanConfigController } from "./plan.config.controller";

const router = express.Router();

// Readable by any authenticated client (subscription screens show the price).
router.get("/", auth("common"), PlanConfigController.getPlans);

// Tier + price + store-mapping management behind the App-Admin identity (§16).
router.patch("/:tier", adminAuth, PlanConfigController.updatePlan);

export const PlanConfigRoutes = router;
