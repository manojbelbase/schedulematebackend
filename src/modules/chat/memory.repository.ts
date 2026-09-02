import { AppDataSource } from "../../config/data-source";
import { ChatMemory, type MemoryType } from "./chat-memory.entity";

const memoryRepository = AppDataSource.getRepository(ChatMemory);

export async function createMemory(data: {
    userId: string;
    conversationId: string;
    content: string;
    embedding: number[];
    memoryType: "preference" | "fact" | "instruction" | "other";
}): Promise<ChatMemory> {
    const memory = memoryRepository.create({
        userId: data.userId,
        conversationId: data.conversationId,
        content: data.content,
        embedding: JSON.stringify(data.embedding),
        memoryType: data.memoryType,
    });
    return await memoryRepository.save(memory);
}

function similarMemoriesQuery(userId: string, queryEmbedding: number[], threshold: number) {
    const maxDistance = 1 - threshold;

    return memoryRepository
        .createQueryBuilder("memory")
        .select("memory.*")
        .addSelect(
            "1 - (memory.embedding <-> :queryEmbedding::vector)",
            "similarity"
        )
        .where("memory.user_id = :userId", { userId })
        .andWhere(
            "(memory.embedding <-> :queryEmbedding::vector) < :maxDistance",
            { maxDistance }
        )
        .setParameters({ queryEmbedding: JSON.stringify(queryEmbedding) })
        .orderBy("similarity", "DESC");
}

function toMemory(row: {
    memory_id: string;
    memory_user_id: string;
    memory_conversation_id: string;
    memory_content: string;
    memory_embedding: string;
    memory_type: string;
    memory_created_at: Date;
    memory_updated_at: Date;
    similarity: number;
}): ChatMemory {
    const memory = new ChatMemory();
    memory.id = row.memory_id;
    memory.userId = row.memory_user_id;
    memory.conversationId = row.memory_conversation_id;
    memory.content = row.memory_content;
    memory.embedding = row.memory_embedding;
    memory.memoryType = row.memory_type as MemoryType;
    memory.similarityScore = row.similarity;
    memory.createdAt = row.memory_created_at;
    memory.updatedAt = row.memory_updated_at;
    return memory;
}

export async function searchSimilarMemories(
    userId: string,
    queryEmbedding: number[],
    limit: number = 5,
    threshold: number = 0.7
): Promise<ChatMemory[]> {
    const results = await similarMemoriesQuery(userId, queryEmbedding, threshold)
        .limit(limit)
        .getRawMany() as Array<{
            memory_id: string;
            memory_user_id: string;
            memory_conversation_id: string;
            memory_content: string;
            memory_embedding: string;
            memory_type: string;
            memory_similarity_score: number;
            memory_created_at: Date;
            memory_updated_at: Date;
            similarity: number;
        }>;

    return results.map(toMemory);
}

export async function findSimilarMemoryForDeduplication(
    userId: string,
    queryEmbedding: number[],
    threshold: number = 0.95
): Promise<ChatMemory | null> {
    const result = await similarMemoriesQuery(userId, queryEmbedding, threshold)
        .limit(1)
        .getRawOne() as {
            memory_id: string;
            memory_user_id: string;
            memory_conversation_id: string;
            memory_content: string;
            memory_embedding: string;
            memory_type: string;
            memory_created_at: Date;
            memory_updated_at: Date;
            similarity: number;
        } | undefined;

    if (!result) {
        return null;
    }

    return toMemory(result);
}

export async function deleteMemory(id: string): Promise<void> {
    await memoryRepository.delete(id);
}

export async function deleteUserMemories(userId: string): Promise<void> {
    await memoryRepository.delete({ userId });
}

export async function countUserMemories(userId: string): Promise<number> {
    return await memoryRepository.countBy({ userId });
}
