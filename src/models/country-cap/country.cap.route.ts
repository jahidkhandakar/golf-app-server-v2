import express from "express";
import { auth } from "../../middlewares/auth";
import { adminAuth } from "../../middlewares/adminAuth";
import { CountryCapController } from "./country.cap.controller";

const router = express.Router();

// Readable by any authenticated client (setup forms show the applicable cap).
router.get("/", auth("common"), CountryCapController.getAll);

// Cap management behind the App-Admin identity (spec §2/§16).
router.post("/", adminAuth, CountryCapController.upsertCap);
router.delete("/:countryCode", adminAuth, CountryCapController.deleteCap);

export const CountryCapRoutes = router;
