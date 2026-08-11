import express from "express";
import { auth } from "../../middlewares/auth";
import { TemplateController } from "./template.controller";

const router = express.Router();

router.post("/", auth("common"), TemplateController.saveTemplate);
router.get("/", auth("common"), TemplateController.getTemplates);
router.delete("/:id", auth("common"), TemplateController.deleteTemplate);

export const TemplateRoutes = router;
