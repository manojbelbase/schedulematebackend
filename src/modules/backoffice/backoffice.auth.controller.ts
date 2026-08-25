import type { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { sendSuccess } from "../../lib/response";
import {
    setAccessTokenCookie,
    setRefreshTokenCookie,
    clearAccessTokenCookie,
    clearRefreshTokenCookie,
} from "../../common/utils/refreshCookie";
import { loginWithEmail } from "../auth/auth.service";
import { UserRole } from "../users/user.entity";

export async function backofficeLoginController(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await loginWithEmail(email, password);

    if (user.role !== UserRole.ADMIN) {
        throw new AppError("Backoffice access denied", httpStatus.FORBIDDEN);
    }

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    sendSuccess(res, httpStatus.OK, "Backoffice login successful", {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
    });
}

export async function backofficeMeController(req: Request, res: Response): Promise<void> {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError("Backoffice access denied", httpStatus.FORBIDDEN);
    }
    const { findUserById } = await import("../users/user.repository");
    const user = await findUserById(req.user.userId);
    if (!user || user.role !== UserRole.ADMIN) {
        throw new AppError("User no longer exists or not admin", httpStatus.UNAUTHORIZED);
    }
    sendSuccess(res, httpStatus.OK, "Current backoffice user fetched successfully", {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
    });
}

export async function backofficeLogoutController(req: Request, res: Response): Promise<void> {
    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);
    sendSuccess(res, httpStatus.OK, "Logged out successfully");
}