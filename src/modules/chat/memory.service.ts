
import { logger } from "../../lib/logger";
import { generateEmbedding } from "../../config/embedding";
import {
    createMemory,
    searchSimilarMemories,
    findSimilarMemoryForDeduplication,
} from "./memory.repository";
import { runAgentTurn } from "./agent.service";
import type { MemoryItem } from "./agent.service";
import type { MemoryType } from "./chat-memory.entity";

export type MemoryExtractionResult = {
    shouldRemember: boolean;
    memory?: string | undefined;
    memoryType?: MemoryType | undefined;
};

export type ChatMemory = {
    id: string;
    userId: string;
    conversationId: string;
    content: string;
    memoryType: MemoryType;
    similarityScore?: number;
};


//  Uses an LLM to determine if a user message contains information worth remembering.

async function extractMemoryDecision(content: string): Promise<MemoryExtractionResult> {
    try {
        const systemPrompt = `You are a memory extraction assistant. Analyze the given user message and determine if it contains useful long-term information that should be remembered.

Respond with JSON:
{
  "shouldRemember": boolean,
  "memory": "string (only if shouldRemember is true)",
  "memoryType": "preference|fact|instruction|other (only if shouldRemember is true)"
}

Guidelines:
- Greetings, acknowledgments, or pleasantries should NOT be remembered
- User preferences (e.g., "I prefer meetings after 2 PM") should be remembered as "preference"
- Factual information (e.g., "My timezone is Asia/Kathmandu") should be remembered as "fact"
- Instructions or rules (e.g., "Don't schedule meetings on Saturday") should be remembered as "instruction"
- Other valuable context should be remembered as "other"
- Keep memories concise and clear`;

        const response = await runAgentTurn(
            "system",
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
            return { shouldRemember: false };
        }

        return {
            shouldRemember: true,
            memory: result.memory ?? undefined,
            memoryType: result.memoryType ?? "other",
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
        // Determine if this message should be remembered
        const extractionResult = await extractMemoryDecision(content);

        if (!extractionResult.shouldRemember || !extractionResult.memory) {
            logger.debug({ userId, extractionResult }, "Message not worth remembering");
            return;
        }

        //Generate embedding for the memory
        let embedding: number[];
        try {
            embedding = await generateEmbedding(extractionResult.memory);
        } catch (embeddingErr) {
            logger.warn(
                { userId, embeddingErr },
                "Failed to generate embedding, skipping memory storage"
            );
            return;
        }

        // Check for duplicate memories (avoid storing same information multiple times)
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

        // Step 4: Store the memory
        await createMemory({
            userId,
            conversationId,
            content: extractionResult.memory,
            embedding,
            memoryType: extractionResult.memoryType ?? "other",
        });

        logger.info(
            { userId, memoryType: extractionResult.memoryType },
            "Memory stored successfully"
        );
    } catch (err) {
        logger.error({ err, userId }, "Unexpected error during memory extraction");
    }
}

/**
 * Retrieves relevant memories for a user query using vector similarity search.
 */
export async function retrieveRelevantMemories(
    userId: string,
    queryText: string,
    limit: number = 5
): Promise<ChatMemory[]> {
    try {
        const queryEmbedding = await generateEmbedding(queryText);
        const memories = await searchSimilarMemories(userId, queryEmbedding, limit, 0.7);
        return memories;
    } catch (err) {
        logger.warn(
            { err, userId },
            "Failed to retrieve relevant memories, proceeding without them"
        );
        return [];
    }
}
