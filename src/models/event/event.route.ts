import express from "express";
import { EventController } from "./event.controller";
import { auth } from "./../../middlewares/auth";
import validateRequest from "./../../shared/validateRequest";
import { eventValidation } from "./event.validation";
import { multiUploadHandler } from "./../../middlewares/fileUploadHandler";

const router = express.Router();

router.post(
  "/",
  auth("admin"),
  multiUploadHandler([{ name: "image", maxCount: 1 }]),
  (req, res, next) => {
    if (req.body && req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(eventValidation.createEvent),
  EventController.createEvent
);

router.get("/", EventController.getAllEvents);
router.get("/:id", EventController.getSingleEvent);

router.put(
  "/:id",
  auth("admin"),
  multiUploadHandler([{ name: "image", maxCount: 1 }]),
  (req, res, next) => {
    if (req.body && req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(eventValidation.updateEvent),
  EventController.updateEvent
);

router.delete("/:id", auth("admin"), EventController.deleteEvent);

export const EventRoutes = router;
