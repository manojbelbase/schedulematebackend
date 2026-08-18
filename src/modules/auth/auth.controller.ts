import type { Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env";
import { buildGoogleAuthUrl, verifyGoogleCode } from "../../config/googleOAuth";
import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { sendSuccess } from "../../lib/response";
import {
    clearAccessTokenCookie,
    clearRefreshTokenCookie,
    setAccessTokenCookie,
    setRefreshTokenCookie,
} from "../../common/utils/refreshCookie";
import { loginByGoogle, refreshUserSession, registerWithEmail, loginWithEmail, toPublicUser } from "./auth.service";
import { findUserById } from "../users/user.repository";
import type { RegisterUserDto } from "./dto/register-user.dto";
import type { LoginUserDto } from "./dto/login-user.dto";

function safeRedirectPath(value: unknown): string {
    if (typeof value !== "string" || !value.startsWith("/")) {
        return "/";
    }
    if (value.startsWith("//")) {
        return "/";
    }
    return value;
}

export async function googleAuthController(req: Request, res: Response): Promise<void> {
    const redirectPath = safeRedirectPath(req.query.redirect);
    const state = jwt.sign({ t: redirectPath }, env.jwtSecret, { expiresIn: "10m" });
    res.redirect(buildGoogleAuthUrl(state, env.googleRedirectUri));
}

export async function googleCallbackController(req: Request, res: Response): Promise<void> {
    try {
        const { code, state } = req.query as { code?: string; state?: string };

        if (!code || typeof state !== "string") {
            res.redirect(`${env.frontendUrl}/auth/login?error=invalid_request`);
            return;
        }

        let redirectPath = "/";
        try {
            const decoded = jwt.verify(state, env.jwtSecret) as JwtPayload & { t?: string };
            redirectPath = safeRedirectPath(decoded.t);
        } catch {
            res.redirect(`${env.frontendUrl}/auth/login?error=invalid_state`);
            return;
        }

        const payload = await verifyGoogleCode(code);

        const { accessToken, refreshToken, user } = await loginByGoogle(payload);

        setAccessTokenCookie(res, accessToken);
        setRefreshTokenCookie(res, refreshToken);

        res.redirect(`${env.frontendUrl}${redirectPath}`);
    } catch (error) {
        res.redirect(`${env.frontendUrl}/auth/login?error=google_authentication_failed`);
    }
}

export async function meController(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        throw new AppError("Not authenticated", httpStatus.UNAUTHORIZED);
    }
    const user = await findUserById(req.user.userId);
    if (!user) {
        throw new AppError("User no longer exists", httpStatus.UNAUTHORIZED);
    }
    sendSuccess(res, httpStatus.OK, "Current user fetched successfully", toPublicUser(user));
}

export async function registerController(req: Request, res: Response): Promise<void> {
    const { email, name, password } = req.body as RegisterUserDto;
    const { accessToken, refreshToken, user } = await registerWithEmail(email, name, password);

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    sendSuccess(res, httpStatus.CREATED, "User registered successfully", {
        user: toPublicUser(user),
    });
}

export async function loginController(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as LoginUserDto;
    const { accessToken, refreshToken, user } = await loginWithEmail(email, password);

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    sendSuccess(res, httpStatus.OK, "Login successful", {
        user: toPublicUser(user),
    });
}

export async function refreshController(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.[env.refreshCookieName] as string | undefined;
    if (!refreshToken) {
        throw new AppError("Refresh token missing", httpStatus.UNAUTHORIZED);
    }

    const { accessToken, refreshToken: nextRefreshToken } = await refreshUserSession(refreshToken);

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, nextRefreshToken);

    sendSuccess(res, httpStatus.OK, "Token refreshed");
}

export async function logoutController(req: Request, res: Response): Promise<void> {
    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);
    sendSuccess(res, httpStatus.OK, "Logged out successfully");
}
