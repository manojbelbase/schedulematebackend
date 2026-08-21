import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";

@Entity("chat_messages")
export class ChatMessage extends BaseEntity {
    @Index()
    @Column({ name: "conversation_id", type: "uuid" })
    conversationId!: string;

    @Column({ type: "varchar", length: 20 })
    role!: "user" | "assistant";

    @Column({ type: "text" })
    content!: string;
}