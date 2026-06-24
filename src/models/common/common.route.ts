import express from "express";
import { CommonController } from "./common.controller";
import { auth } from "./../../middlewares/auth";
import validateRequest from "./../../shared/validateRequest";
import { CommonValidation } from "./common.validation";

const router = express.Router();

// about us
router.post(
  "/about/create",
  validateRequest(CommonValidation.commonSettingsSchema),
  auth("admin"),
  CommonController.createAbout,
);

router.get("/about", CommonController.getAbout);

router.patch("/about/update/:id", auth("admin"), CommonController.updateAbout);

// terms and conditions
router.post(
  "/terms/create",
  validateRequest(CommonValidation.commonSettingsSchema),
  auth("admin"),
  CommonController.createTermsInDB,
);

router.get("/terms", CommonController.getTermsFromDB);

router.patch(
  "/terms/update/:id",
  auth("admin"),
  CommonController.updateTermsInDB,
);

// privacy policy
router.post(
  "/privacy-policy/create",
  validateRequest(CommonValidation.commonSettingsSchema),
  auth("admin"),
  CommonController.createPrivacyPolicyInDB,
);

router.get("/privacy-policy", CommonController.getPrivacyPolicyFromDB);

router.patch(
  "/privacy-policy/update/:id",
  auth("admin"),
  CommonController.updatePrivacyPolicyInDB,
);

router.get("/support", CommonController.getSupport);

router.post(
  "/create-or-update",
  auth("admin"),
  CommonController.createOrUpdateSupport,
);

export const CommonRoutes = router;
