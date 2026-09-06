
import { logger } from "../../lib/logger";
import { generateEmbedding } from "../../config/embedding";
import {
    createMemory,
    searchSimilarMemories,
    findSimilarMemoryForDeduplication,
} from "./memory.repository";
import { runAgentTurn } from "./agent.service";

export type MemoryExtractionResult = {
    shouldRemember: boolean;
    memory?: string | undefined;
};

export type ChatMemory = {
    id: string;
    userId: string;
    conversationId: string;
    content: string;
    similarityScore?: number;
};


async function extractMemoryDecision(userId: string, content: string): Promise<MemoryExtractionResult> {
    try {
        const systemPrompt = `You are a memory extraction assistant. Analyze the given user message and determine if it contains useful long-term information that should be remembered.

Respond with JSON:
{
  "shouldRemember": boolean,
  "memory": "string (only if shouldRemember is true)"
}

Guidelines:
- Greetings, acknowledgments, or pleasantries should NOT be remembered
- User preferences (e.g., "I prefer meetings after 2 PM") should be remembered
- Factual information (e.g., "My timezone is Asia/Kathmandu") should be remembered
- Instructions or rules (e.g., "Don't schedule meetings on Saturday") should be remembered
- Other valuable context should be remembered
- Keep memories concise and clear`;

        const response = await runAgentTurn(
            userId,
            [{ role: "user", content }],
            { systemPromptOverride: systemPrompt }
        );

        const raw = response.trim();
        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch {
            const withoutFences = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
            const jsonMatch = withoutFences.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn({ response }, "Memory extraction response does not contain valid JSON");
                return { shouldRemember: false };
            }
            parsed = JSON.parse(jsonMatch[0]);
        }

        const result = parsed as Partial<MemoryExtractionResult>;

        if (!result.shouldRemember) {
            logger.info({ userId, parsed }, "LLM decided message is NOT memorable");
            return { shouldRemember: false };
        }

        logger.info({ userId, memoryPreview: result.memory?.slice(0, 100) }, "LLM decided message IS memorable");
        return {
            shouldRemember: true,
            memory: result.memory ?? undefined,
        };
    } catch (err) {
        logger.warn({ err }, "Memory extraction failed, treating as non-memorable");
        return { shouldRemember: false };
    }
}


export async function extractAndStoreMemory(
    userId: string,
    conversationId: string,
    content: string
): Promise<void> {
    try {
        logger.info({ userId, conversationId, contentPreview: content.slice(0, 80) }, "Memory extraction started");

        const extractionResult = await extractMemoryDecision(userId, content);
        logger.info({ userId, shouldRemember: extractionResult.shouldRemember }, "Memory extraction decision");

        if (!extractionResult.shouldRemember || !extractionResult.memory) {
            logger.debug({ userId }, "Message not worth remembering");
            return;
        }

        let embedding: number[];
        try {
            embedding = await generateEmbedding(extractionResult.memory);
            logger.info({ userId, embeddingLength: embedding.length }, "Embedding generated");
        } catch (embeddingErr) {
            logger.warn(
                { userId, embeddingErr },
                "Failed to generate embedding, skipping memory storage"
            );
            return;
        }

        try {
            const duplicateMemory = await findSimilarMemoryForDeduplication(userId, embedding, 0.95);
            if (duplicateMemory) {
                logger.debug(
                    { userId, existingMemoryId: duplicateMemory.id },
                    "Similar memory already exists, skipping duplicate"
                );
                return;
            }
        } catch (dedupeErr) {
            logger.warn({ dedupeErr }, "Deduplication check failed, proceeding with memory creation");
        }

        const stored = await createMemory({
            userId,
            conversationId,
            content: extractionResult.memory,
            embedding,
        });

        logger.info(
            { userId, memoryId: stored.id },
            "Memory stored successfully"
        );
    } catch (err) {
        logger.error({ err, userId }, "Unexpected error during memory extraction");
    }
}

export async function retrieveRelevantMemories(
    userId: string,
    queryText: string,
    limit: number = 5
): Promise<ChatMemory[]> {
    try {
        const queryEmbedding = await generateEmbedding(queryText);
        logger.info({ userId, queryTextPreview: queryText.slice(0, 80), embeddingLength: queryEmbedding.length }, "Memory retrieval started");
        const memories = await searchSimilarMemories(userId, queryEmbedding, limit, 0.15);
        logger.info({ userId, count: memories.length }, "Memory retrieval completed");
        return memories;
    } catch (err) {
        logger.warn(
            { err, userId },
            "Failed to retrieve relevant memories, proceeding without them"
        );
        return [];
    }
}
