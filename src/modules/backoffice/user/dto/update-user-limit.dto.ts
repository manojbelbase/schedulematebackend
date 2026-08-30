import { z } from "zod";

export const updateUserLimitSchema = z.object({
    apiRequestLimit: z.number().int().min(0).max(100000).optional(),
    resetUsed: z.boolean().optional(),
});

export type UpdateUserLimitDto = z.infer<typeof updateUserLimitSchema>;
