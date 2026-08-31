import type { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { sendSuccess } from "../../lib/response";
import { requestCalendarAccess } from "./accessRequest.service";
import type { RequestAccessDto } from "./dto/request-access.dto";

export async function requestAccessController(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        throw new AppError("Not authenticated", httpStatus.UNAUTHORIZED);
    }
    const body = (req.body ?? {}) as Partial<RequestAccessDto>;
    const { message } = body;
    await requestCalendarAccess(req.user.userId, message);
    sendSuccess(res, httpStatus.CREATED, "Access request submitted. We will notify you once your Google account is approved.");
}
