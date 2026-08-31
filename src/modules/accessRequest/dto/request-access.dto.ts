import { z } from "zod";

export const requestAccessSchema = z.object({
    message: z.string().max(1000).optional(),
});

export type RequestAccessDto = z.infer<typeof requestAccessSchema>;
