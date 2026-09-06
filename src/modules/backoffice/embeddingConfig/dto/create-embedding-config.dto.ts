import { z } from "zod";

export const createEmbeddingConfigSchema = z.object({
    name: z.string().min(1).max(100),
    isActive: z.boolean().optional().default(true),
    activeProvider: z.string().min(1),
    apiKey: z.string().min(1),
    model: z.string().optional(),
});

export type CreateEmbeddingConfigDto = z.infer<typeof createEmbeddingConfigSchema>;
