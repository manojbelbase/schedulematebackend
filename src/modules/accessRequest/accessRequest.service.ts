import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { env } from "../../config/env";
import { sendAccessRequestEmail, sendAccessRequestStatusEmail } from "../../lib/mailer";
import { buildPagination } from "../../common/utils/pagination";
import type { ListQueryOptions } from "../../common/utils/pagination";
import { findUserById } from "../users/user.repository";
import {
    createAccessRequest,
    listAccessRequests,
    updateAccessRequestStatus,
} from "./accessRequest.repository";
import { AccessRequestStatus } from "./accessRequest.entity";
import type { AccessRequest } from "./accessRequest.entity";

export async function requestCalendarAccess(userId: string, message?: string): Promise<AccessRequest> {
    const user = await findUserById(userId);
    if (!user) {
        throw new AppError("User not found", httpStatus.NOT_FOUND);
    }

    const request = await createAccessRequest({
        userId,
        requesterEmail: user.email,
        requesterName: user.name ?? null,
        message: message ?? `Requested Google Calendar access from the web app (${user.email}).`,
    });

    try {
        await sendAccessRequestEmail({
            to: env.adminEmail,
            requesterEmail: user.email,
            requesterName: user.name ?? null,
            message: message ?? null,
        });
    } catch {
        // Never fail the request because the notification email could not be sent.
    }

    return request;
}

export async function listCalendarAccessRequestsService(query: ListQueryOptions) {
    const { items, total } = await listAccessRequests(query);
    const pagination = buildPagination(total, query.page, query.take, items.length);
    return { items, pagination };
}

export async function updateAccessRequestStatusService(
    id: string,
    status: AccessRequestStatus
): Promise<AccessRequest> {
    if (!Object.values(AccessRequestStatus).includes(status)) {
        throw new AppError("Invalid status", httpStatus.BAD_REQUEST);
    }
    const updated = await updateAccessRequestStatus(id, status);
    if (!updated) {
        throw new AppError("Access request not found", httpStatus.NOT_FOUND);
    }

    if (status === AccessRequestStatus.APPROVED || status === AccessRequestStatus.REJECTED) {
        try {
            await sendAccessRequestStatusEmail({
                to: updated.requesterEmail,
                requesterName: updated.requesterName,
                status,
            });
        } catch {
            // Never fail the status update because the notification email could not be sent.
        }
    }

    return updated;
}
