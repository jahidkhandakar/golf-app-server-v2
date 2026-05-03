import express from "express";
import { TicketController } from "./ticket.controller";
import { auth } from "./../../middlewares/auth";
import validateRequest from "./../../shared/validateRequest";
import { ticketValidation } from "./ticket.validation";

const router = express.Router();

router.post(
  "/purchase",
  auth("admin", "user"),
  validateRequest(ticketValidation.purchaseTicket),
  TicketController.purchaseTicket
);

router.get(
  "/my",
  auth("admin", "user"),
  TicketController.getMyTickets
);

router.get(
  "/all",
  auth("admin"),
  TicketController.getAllTickets
);

export const TicketRoutes = router;
