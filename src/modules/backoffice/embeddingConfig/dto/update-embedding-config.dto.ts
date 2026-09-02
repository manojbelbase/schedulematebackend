import { z } from "zod";

export const updateEmbeddingConfigSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
    activeProvider: z.string().min(1).optional(),
    apiKey: z.string().min(1).optional(),
    model: z.string().optional(),
});

export type UpdateEmbeddingConfigDto = z.infer<typeof updateEmbeddingConfigSchema>;
