import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";

@Entity("chat_conversations")
export class ChatConversation extends BaseEntity {
    @Index()
    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ type: "varchar", length: 255, default: "New conversation" })
    title!: string;
}