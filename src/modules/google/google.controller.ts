import type { Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { sendSuccess } from "../../lib/response";
import { buildGoogleConnectAuthUrl, getGoogleCredentials } from "../../config/googleOAuth";
import { disconnectGoogle, getConnectionStatus, saveGoogleCredentials } from "./google.service";

function safeRedirectPath(value: unknown): string {
    if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
        return "/";
    }
    return value;
}

export async function googleStatusController(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        throw new AppError("Not authenticated", httpStatus.UNAUTHORIZED);
    }
    const status = await getConnectionStatus(req.user.userId);
    sendSuccess(res, httpStatus.OK, "Google Calendar connection status", status);
}

export async function googleConnectController(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        throw new AppError("Not authenticated", httpStatus.UNAUTHORIZED);
    }
    const redirectPath = safeRedirectPath(req.query.redirect);
    const state = jwt.sign({ sub: req.user.userId, t: redirectPath }, env.jwtSecret, {
        expiresIn: "10m",
    });
    const connectUrl = buildGoogleConnectAuthUrl(state, env.googleConnectRedirectUri);
    res.redirect(connectUrl);
}

export async function googleConnectCallbackController(req: Request, res: Response): Promise<void> {
    try {
        const { code, state } = req.query as { code?: string; state?: string };

        if (!code || typeof state !== "string") {
            res.redirect(`${env.frontendUrl}/settings?error=invalid_request`);
            return;
        }

        let userId: string;
        let redirectPath = "/settings";
        try {
            const decoded = jwt.verify(state, env.jwtSecret) as JwtPayload & {
                sub?: string;
                t?: string;
            };
            if (!decoded.sub) {
                res.redirect(`${env.frontendUrl}/settings?error=invalid_state`);
                return;
            }
            userId = decoded.sub;
            redirectPath = safeRedirectPath(decoded.t) || "/settings";
        } catch {
            res.redirect(`${env.frontendUrl}/settings?error=invalid_state`);
            return;
        }

        const { credentials, email } = await getGoogleCredentials(code, env.googleConnectRedirectUri);
        await saveGoogleCredentials(userId, credentials, email ?? null);

        res.redirect(`${env.frontendUrl}${redirectPath}?google=connected`);
    } catch {
        res.redirect(`${env.frontendUrl}/settings?error=google_connection_failed`);
    }
}

export async function googleDisconnectController(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        throw new AppError("Not authenticated", httpStatus.UNAUTHORIZED);
    }
    await disconnectGoogle(req.user.userId);
    sendSuccess(res, httpStatus.OK, "Google Calendar disconnected");
}
