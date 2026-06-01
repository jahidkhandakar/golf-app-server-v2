import express from "express";
import { UserRoutes } from "../models/user/user.route";
import { AuthRoutes } from "../models/auth/auth.route";

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
];

apiRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
