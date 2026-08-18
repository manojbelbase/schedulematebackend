import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/AppError";
import { httpStatus } from "../../constants/httpStatus";

export function validateBody(schema: ZodType): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            next(new AppError("Invalid request body", httpStatus.BAD_REQUEST));
            return;
        }
        req.body = result.data;
        next();
    };
}