import type { Response } from "express";
import { env } from "../../config/env";

export const ACCESS_TOKEN_COOKIE_NAME = env.accessTokenCookieName;
export const REFRESH_TOKEN_COOKIE_NAME = env.refreshCookieName;

function cookieDefaults() {
    return {
        httpOnly: true,
        // Frontend and API run on different origins (e.g. localhost:3000 -> localhost:8000),
        // so the auth cookie must be sent cross-site (SameSite=None + Secure) to be stored
        // by the browser and available to the app's proxy/middleware after login.
        sameSite: "none" as const,
        secure: true,
        path: "/",
    };
}

export function maxAgeAccessMs(): number {
    const value = env.jwtAccessExpiresIn.match(/(\d+)(m|h|d)/);
    if (!value) return 15 * 60 * 1000;
    const amount = Number(value[1]);
    const unit = value[2];
    if (unit === "m") return amount * 60 * 1000;
    if (unit === "h") return amount * 60 * 60 * 1000;
    return amount * 24 * 60 * 60 * 1000;
}

export function maxAgeRefreshMs(): number {
    const value = env.jwtRefreshExpiresIn.match(/(\d+)(m|h|d)/);
    if (!value) return 7 * 24 * 60 * 60 * 1000;
    const amount = Number(value[1]);
    const unit = value[2];
    if (unit === "m") return amount * 60 * 1000;
    if (unit === "h") return amount * 60 * 60 * 1000;
    return amount * 24 * 60 * 60 * 1000;
}

export function setAccessTokenCookie(res: Response, token: string): void {
    res.cookie(ACCESS_TOKEN_COOKIE_NAME, token, {
        ...cookieDefaults(),
        maxAge: maxAgeAccessMs(),
    });
}

export function clearAccessTokenCookie(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, cookieDefaults());
}

export function setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
        ...cookieDefaults(),
        maxAge: maxAgeRefreshMs(),
    });
}

export function clearRefreshTokenCookie(res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, cookieDefaults());
}
