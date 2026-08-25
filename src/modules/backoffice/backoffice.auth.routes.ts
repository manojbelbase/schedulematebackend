import { Router } from "express";
import { asyncHandler } from "../../common/middleware/asyncHandler";
import { validateBody } from "../../common/middleware/validateBody";
import { loginUserSchema } from "../auth/dto/login-user.dto";
import { authenticate } from "../../common/middleware/auth";
import {
    backofficeLoginController,
    backofficeMeController,
    backofficeLogoutController,
} from "./backoffice.auth.controller";

export const backofficeAuthRouter: Router = Router();

backofficeAuthRouter.post(
    "/login",
    validateBody(loginUserSchema),
    asyncHandler(backofficeLoginController)
);

backofficeAuthRouter.use(authenticate());

backofficeAuthRouter.get("/me", asyncHandler(backofficeMeController));
backofficeAuthRouter.post("/logout", asyncHandler(backofficeLogoutController));