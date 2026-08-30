import { z } from "zod";
import { LLM_PROVIDER_KEYS } from "../../../../config/llmProviders";

export const createLlmConfigSchema = z.object({
    name: z.string().min(1).max(100),
    isActive: z.boolean().optional().default(false),
    activeProvider: z
        .enum(LLM_PROVIDER_KEYS as unknown as [string, ...string[]])
        .default("deepseek"),
    apiKey: z.string().min(1).max(500),
    model: z.string().max(200).optional(),
});

export type CreateLlmConfigDto = z.infer<typeof createLlmConfigSchema>;