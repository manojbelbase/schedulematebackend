import { Router } from "express";
import { asyncHandler } from "../../common/middleware/asyncHandler";
import { authenticate } from "../../common/middleware/auth";
import { requireAdmin } from "../../common/middleware/auth";
import { listUsersController } from "./backoffice.controller";

export const backofficeRouter: Router = Router();

backofficeRouter.use(authenticate());
backofficeRouter.use(requireAdmin());

backofficeRouter.get("/users", asyncHandler(listUsersController));