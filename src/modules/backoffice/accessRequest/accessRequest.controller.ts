import type { Request, Response } from "express";
import { httpStatus } from "../../../constants/httpStatus";
import { sendSuccess } from "../../../lib/response";
import { parseListQuery } from "../../../common/utils/pagination";
import {
    listCalendarAccessRequestsService,
    updateAccessRequestStatusService,
} from "../../accessRequest/accessRequest.service";
import { AccessRequestStatus } from "../../accessRequest/accessRequest.entity";

function toPublicRequest(request: {
    id: string;
    requesterEmail: string;
    requesterName: string | null;
    message: string | null;
    status: AccessRequestStatus;
    createdAt: Date;
    user?: { id: string; email: string; name: string | null };
}) {
    return {
        id: request.id,
        requesterEmail: request.requesterEmail,
        requesterName: request.requesterName,
        message: request.message,
        status: request.status,
        createdAt: request.createdAt,
        user: request.user
            ? { id: request.user.id, email: request.user.email, name: request.user.name }
            : null,
    };
}

export async function listAccessRequestsController(req: Request, res: Response) {
    const query = parseListQuery(req.query);
    const result = await listCalendarAccessRequestsService(query);
    const publicRequests = result.items.map(toPublicRequest);
    sendSuccess(
        res,
        httpStatus.OK,
        "Access requests fetched successfully",
        publicRequests,
        result.pagination
    );
}

export async function updateAccessRequestStatusController(req: Request, res: Response) {
    const { id } = req.params;
    const status = (req.body as { status: string }).status as AccessRequestStatus;
    const updated = await updateAccessRequestStatusService(id as string, status);
    sendSuccess(
        res,
        httpStatus.OK,
        "Access request status updated successfully",
        toPublicRequest(updated)
    );
}
