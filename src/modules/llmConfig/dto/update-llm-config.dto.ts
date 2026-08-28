import { z } from "zod";
import { LLM_PROVIDER_KEYS } from "../../../config/llmProviders";

export const updateLlmConfigSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
    activeProvider: z
        .enum(LLM_PROVIDER_KEYS as unknown as [string, ...string[]])
        .optional(),
    apiKey: z.string().max(500).optional(),
    model: z.string().max(200).optional(),
    baseUrl: z.string().url().max(500).optional(),
});

export type UpdateLlmConfigDto = z.infer<typeof updateLlmConfigSchema>;
