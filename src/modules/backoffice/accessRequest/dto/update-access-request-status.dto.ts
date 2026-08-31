import { z } from "zod";
import { AccessRequestStatus } from "../../../accessRequest/accessRequest.entity";
export const updateAccessRequestStatusSchema = z.object({
    status: z.enum([
        AccessRequestStatus.PENDING,
        AccessRequestStatus.APPROVED,
        AccessRequestStatus.REJECTED
    ]),
});

export type UpdateAccessRequestStatusDto = z.infer<typeof updateAccessRequestStatusSchema>;
