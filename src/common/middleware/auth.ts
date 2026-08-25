import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { env } from "../../config/env";
import { verifyAccessToken } from "../utils/jwt";
import { findUserById } from "../../modules/users/user.repository";
import type { User } from "../../modules/users/user.entity";
import { UserRole } from "../../modules/users/user.entity";

export type AuthContext = {
    authUserId: string;
    email: string;
    name: string;
    userId: string;
    role: UserRole;
    tokenId: Record<string, unknown> | undefined;
};

function fromAuthContext(user: User): AuthContext {
    return {
        authUserId: user.googleId ?? user.id,
        email: user.email,
        name: user.name ?? "",
        userId: user.id,
        role: user.role,
        tokenId: undefined,
    };
}

function extractToken(req: Request): string {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
        return header.slice("Bearer ".length);
    }
    const cookieToken = req.cookies?.[env.accessTokenCookieName] as string | undefined;
    if (cookieToken) {
        return cookieToken;
    }
    throw new AppError("Authorization header missing", httpStatus.UNAUTHORIZED);
}

export function authenticate(): RequestHandler {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            const token = extractToken(req);
            const decoded = verifyAccessToken(token);
            const user = await findUserById(decoded.sub);
            if (!user) {
                throw new AppError("User no longer exists", httpStatus.UNAUTHORIZED);
            }
            req.user = fromAuthContext(user);
            next();
        } catch (error) {
            if (error instanceof AppError) {
                next(error);
                return;
            }
            next(new AppError("Invalid or expired token", httpStatus.UNAUTHORIZED));
        }
    };
}

export function requireAdmin(): RequestHandler {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        if (!req.user || req.user.role !== UserRole.ADMIN) {
            next(new AppError("Admin access required", httpStatus.FORBIDDEN));
            return;
        }
        next();
    };
}
