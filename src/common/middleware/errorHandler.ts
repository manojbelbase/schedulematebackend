import type { NextFunction, Request, Response } from "express";
import { logger } from "../../lib/logger";
import { AppError } from "../errors/AppError";

export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof AppError) {
        const response: Record<string, unknown> = { success: false, message: err.message };
        if (err.payload) {
            response.payload = err.payload;
        }
        res.status(err.statusCode).json(response);
        return;
    }

    logger.error({ err }, "Unhandled error occurred");
    res.status(500).json({ success: false, message: "Internal Server Error" });
}