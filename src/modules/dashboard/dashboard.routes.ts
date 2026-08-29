import { Router } from "express";
import { asyncHandler } from "../../common/middleware/asyncHandler";
import { usersDashboardController } from "./dashboard.controller";

export const dashboardRouter: Router = Router();

dashboardRouter.get("/users", asyncHandler(usersDashboardController));
