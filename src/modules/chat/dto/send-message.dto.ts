import { z } from "zod";

export const sendMessageSchema = z.object({
    conversationId: z.string().uuid().optional(),
    content: z.string().min(1).max(10000),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;