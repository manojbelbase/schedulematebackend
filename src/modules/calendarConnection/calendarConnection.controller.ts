import type { Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { sendSuccess } from "../../lib/response";
import { safeRedirectPath } from "../../common/utils/redirect";
import { buildGoogleConnectAuthUrl, getGoogleCredentials } from "../../config/googleOAuth";
import {
    disconnectConnection,
    getConnectionStatus,
    saveConnectionCredentials,
} from "./calendarConnection.service";

function getStateSecret(): string {
    if (!env.jwtStateSecret) {
        throw new AppError("OAuth state secret is not configured", httpStatus.INTERNAL_SERVER_ERROR);
    }
    return env.jwtStateSecret;
}

export async function getConnectionStatusController(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        throw new AppError("Not authenticated", httpStatus.UNAUTHORIZED);
    }
    const status = await getConnectionStatus(req.user.userId);
    sendSuccess(res, httpStatus.OK, "Calendar connection status", status);
}

export async function connectController(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        throw new AppError("Not authenticated", httpStatus.UNAUTHORIZED);
    }
    const redirectPath = safeRedirectPath(req.query.redirect);
    const state = jwt.sign({ sub: req.user.userId, t: redirectPath }, getStateSecret(), {
        expiresIn: "10m",
    });
    const connectUrl = buildGoogleConnectAuthUrl(state, env.googleConnectRedirectUri);
    res.redirect(connectUrl);
}

export async function connectCallbackController(req: Request, res: Response): Promise<void> {
    try {
        const { code, state } = req.query as { code?: string; state?: string };

        if (!code || typeof state !== "string") {
            res.redirect(`${env.frontendUrl}/?error=invalid_request`);
            return;
        }

        let userId: string;
        let redirectPath = "/";
        try {
            const decoded = jwt.verify(state, getStateSecret()) as JwtPayload & {
                sub?: string;
                t?: string;
            };
            if (!decoded.sub) {
                res.redirect(`${env.frontendUrl}/?error=invalid_state`);
                return;
            }
            userId = decoded.sub;
            redirectPath = safeRedirectPath(decoded.t) || "/";
        } catch {
            res.redirect(`${env.frontendUrl}/?error=invalid_state`);
            return;
        }

        const { credentials, email } = await getGoogleCredentials(code, env.googleConnectRedirectUri);
        await saveConnectionCredentials(userId, credentials, email ?? null);

        res.redirect(`${env.frontendUrl}${redirectPath}?google=connected`);
    } catch {
        res.redirect(`${env.frontendUrl}/?error=google_connection_failed`);
    }
}

export async function disconnectController(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        throw new AppError("Not authenticated", httpStatus.UNAUTHORIZED);
    }
    await disconnectConnection(req.user.userId);
    sendSuccess(res, httpStatus.OK, "Calendar connection disconnected");
}
