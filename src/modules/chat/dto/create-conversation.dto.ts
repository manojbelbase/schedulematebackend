import { z } from "zod";

export const createConversationSchema = z.object({
    title: z.string().min(1).max(255).optional(),
});

export type CreateConversationDto = z.infer<typeof createConversationSchema>;