import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";

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

    @Index()
    @Column({ name: "embedding", type: "vector", length: 1536 })
    embedding!: string;

    similarityScore?: number;
}
