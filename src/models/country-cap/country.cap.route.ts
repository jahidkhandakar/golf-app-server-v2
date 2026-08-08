import express from "express";
import { auth } from "../../middlewares/auth";
import { CountryCapController } from "./country.cap.controller";

const router = express.Router();

// Readable by any authenticated client (setup forms show the applicable cap).
router.get("/", auth("common"), CountryCapController.getAll);

// Admin-only management — edit caps without a code deploy (spec §2).
router.post("/", auth("admin"), CountryCapController.upsertCap);
router.delete("/:countryCode", auth("admin"), CountryCapController.deleteCap);

export const CountryCapRoutes = router;
