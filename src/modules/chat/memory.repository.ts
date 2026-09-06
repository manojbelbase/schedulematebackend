import { AppDataSource } from "../../config/data-source";
import { ChatMemory } from "./chat-memory.entity";

const memoryRepository = AppDataSource.getRepository(ChatMemory);

function toPgVectorLiteral(embedding: number[]): string {
    return `[${embedding.join(",")}]`;
}

export async function createMemory(data: {
    userId: string;
    conversationId: string;
    content: string;
    embedding: number[];
}): Promise<ChatMemory> {
    const memory = memoryRepository.create({
        userId: data.userId,
        conversationId: data.conversationId,
        content: data.content,
        embedding: toPgVectorLiteral(data.embedding),
    });
    return await memoryRepository.save(memory);
}

function similarMemoriesQuery(userId: string, queryEmbedding: number[], threshold: number) {
    const maxDistance = 1 - threshold;

    return memoryRepository
        .createQueryBuilder("memory")
        .select("memory.*")
        .addSelect(
            "1 - (memory.embedding <=> :queryEmbedding::vector)",
            "similarity"
        )
        .where("memory.user_id = :userId", { userId })
        .andWhere(
            "(memory.embedding <=> :queryEmbedding::vector) < :maxDistance",
            { maxDistance }
        )
        .setParameters({ queryEmbedding: toPgVectorLiteral(queryEmbedding) })
        .orderBy("similarity", "DESC");
}

function toMemory(row: Record<string, unknown>): ChatMemory {
    const memory = new ChatMemory();
    memory.id = (row.memory_id ?? row.id) as string;
    memory.userId = (row.memory_user_id ?? row.user_id) as string;
    memory.conversationId = (row.memory_conversation_id ?? row.conversation_id) as string;
    memory.content = (row.memory_content ?? row.content) as string;
    memory.embedding = (row.memory_embedding ?? row.embedding) as string;
    memory.similarityScore = (row.similarity ?? row.memory_similarity_score) as number;
    memory.createdAt = (row.memory_created_at ?? row.created_at) as Date;
    memory.updatedAt = (row.memory_updated_at ?? row.updated_at) as Date;
    return memory;
}

export async function searchSimilarMemories(
    userId: string,
    queryEmbedding: number[],
    limit: number = 5,
    threshold: number = 0.2
): Promise<ChatMemory[]> {
    const results = await similarMemoriesQuery(userId, queryEmbedding, threshold)
        .limit(limit)
        .getRawMany();

    return results.map(toMemory);
}

export async function findSimilarMemoryForDeduplication(
    userId: string,
    queryEmbedding: number[],
    threshold: number = 0.95
): Promise<ChatMemory | null> {
    const result = await similarMemoriesQuery(userId, queryEmbedding, threshold)
        .limit(1)
        .getRawOne();

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
