import type { MigrationInterface, QueryRunner } from "typeorm";

export class RecreateChatMemories1789400000000 implements MigrationInterface {
    name = "RecreateChatMemories1789400000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chat_memories" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "user_id" uuid NOT NULL,
                "conversation_id" uuid NOT NULL,
                "content" text NOT NULL,
                "embedding" vector(1536) NOT NULL,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_chat_memories_user_id" ON "chat_memories" ("user_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_chat_memories_conversation_id" ON "chat_memories" ("conversation_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_chat_memories_embedding" ON "chat_memories" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "chat_memories"`);
    }
}
