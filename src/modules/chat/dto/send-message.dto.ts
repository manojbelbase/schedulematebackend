import { z } from "zod";

export const sendMessageSchema = z.object({
    conversationId: z.string().uuid().optional(),
    content: z.string().min(1).max(10000),
    timezone: z.string().min(1).max(64).optional(),
    provider: z.string().min(1).max(32).optional(),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
