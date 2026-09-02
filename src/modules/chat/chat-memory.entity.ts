import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";

export type MemoryType = "preference" | "fact" | "instruction" | "other";

@Entity("chat_memories")
export class ChatMemory extends BaseEntity {
    @Index()
    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Index()
    @Column({ name: "conversation_id", type: "uuid" })
    conversationId!: string;

    @Column({ type: "text" })
    content!: string;

    @Column({ name: "memory_type", type: "varchar", length: 50, default: "other" })
    memoryType!: MemoryType;

    @Index()
    @Column({ name: "embedding", type: "vector", length: 1536 })
    embedding!: string;

    @Column({ name: "similarity_score", type: "float", nullable: true })
    similarityScore?: number;
}
