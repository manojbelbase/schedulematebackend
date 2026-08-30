import { Router } from "express";
import { authenticate } from "../../common/middleware/auth";
import { requireAdmin } from "../../common/middleware/auth";
import { dashboardRouter } from "./dashboard/dashboard.routes";
import { userRouter } from "./user/user.routes";

export const backofficeRouter: Router = Router();

backofficeRouter.use(authenticate());
backofficeRouter.use(requireAdmin());

backofficeRouter.use("/dashboard", dashboardRouter);
backofficeRouter.use("/users", userRouter);