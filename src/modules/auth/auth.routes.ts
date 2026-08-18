import { Router } from "express";
import { asyncHandler } from "../../common/middleware/asyncHandler";
import { authenticate } from "../../common/middleware/auth";
import { validateBody } from "../../common/middleware/validateBody";
import { registerUserSchema } from "./dto/register-user.dto";
import { loginUserSchema } from "./dto/login-user.dto";
import {
    googleAuthController,
    googleCallbackController,
    loginController,
    logoutController,
    meController,
    refreshController,
    registerController,
} from "./auth.controller";

export const authRouter: Router = Router();

authRouter.post("/register", validateBody(registerUserSchema), asyncHandler(registerController));
authRouter.post("/login", validateBody(loginUserSchema), asyncHandler(loginController));
authRouter.get("/google", asyncHandler(googleAuthController));
authRouter.get("/google/callback", asyncHandler(googleCallbackController));
authRouter.get("/me", authenticate(), asyncHandler(meController));
authRouter.post("/refresh", asyncHandler(refreshController));
authRouter.post("/logout", asyncHandler(logoutController));
