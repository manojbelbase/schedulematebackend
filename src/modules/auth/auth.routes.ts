import { Router } from "express";
import { asyncHandler } from "../../common/middleware/asyncHandler";
import { authenticate } from "../../common/middleware/auth";
import { validateBody } from "../../common/middleware/validateBody";
import { registerUserSchema } from "./dto/register-user.dto";
import { loginUserSchema } from "./dto/login-user.dto";
import { forgotPasswordSchema } from "./dto/forgot-password.dto";
import { verifyOtpSchema } from "./dto/verify-otp.dto";
import { resetPasswordSchema } from "./dto/reset-password.dto";
import {
    googleAuthController,
    googleCallbackController,
    loginController,
    logoutController,
    meController,
    refreshController,
    registerController,
} from "./auth.controller";
import {
    forgotPasswordController,
    resetPasswordController,
    verifyOtpController,
} from "./password-reset.controller";

export const authRouter: Router = Router();

authRouter.post("/register", validateBody(registerUserSchema), asyncHandler(registerController));
authRouter.post("/login", validateBody(loginUserSchema), asyncHandler(loginController));
authRouter.get("/google", asyncHandler(googleAuthController));
authRouter.get("/google/callback", asyncHandler(googleCallbackController));
authRouter.get("/me", authenticate(), asyncHandler(meController));
authRouter.post("/refresh", asyncHandler(refreshController));
authRouter.post("/logout", asyncHandler(logoutController));
authRouter.post("/forgot-password", validateBody(forgotPasswordSchema), asyncHandler(forgotPasswordController));
authRouter.post("/verify-otp", validateBody(verifyOtpSchema), asyncHandler(verifyOtpController));
authRouter.post("/reset-password", validateBody(resetPasswordSchema), asyncHandler(resetPasswordController));
