import express from "express";
import { auth } from "../../middlewares/auth";
import { PlanConfigController } from "./plan.config.controller";

const router = express.Router();

// Readable by any authenticated client (subscription screens show the price).
router.get("/", auth("common"), PlanConfigController.getPlans);

// Admin-only tier + price + store-mapping management (spec §16).
router.patch("/:tier", auth("admin"), PlanConfigController.updatePlan);

export const PlanConfigRoutes = router;
