import express from "express";
import { UserRoutes } from "../models/user/user.route";
import { AuthRoutes } from "../models/auth/auth.route";
import { CategoryRoutes } from "../models/category/category.route";
import { EventRoutes } from "../models/event/event.route";
import { TicketRoutes } from "../models/ticket/ticket.route";

const router = express.Router();

const apiRoutes: any[] = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/categories",
    route: CategoryRoutes,
  },
  {
    path: "/events",
    route: EventRoutes,
  },
  {
    path: "/tickets",
    route: TicketRoutes,
  },
];

apiRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
