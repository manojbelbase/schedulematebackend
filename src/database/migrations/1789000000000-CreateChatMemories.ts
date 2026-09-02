import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChatMemories1789000000000 implements MigrationInterface {
    name = "CreateChatMemories1789000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable pgvector extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

        // Create chat_memories table
        await queryRunner.query(`
            CREATE TABLE "chat_memories" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "user_id" uuid NOT NULL,
                "conversation_id" uuid NOT NULL,
                "content" text NOT NULL,
                "embedding" vector(1536) NOT NULL,
                "memory_type" character varying(50) NOT NULL DEFAULT 'other',
                "similarity_score" double precision,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now()
            )
        `);

        // Create indexes
        await queryRunner.query(
            `CREATE INDEX "idx_chat_memories_user_id" ON "chat_memories" ("user_id")`
        );
        await queryRunner.query(
            `CREATE INDEX "idx_chat_memories_conversation_id" ON "chat_memories" ("conversation_id")`
        );
        // Vector index for cosine distance search using ivfflat
        await queryRunner.query(
            `CREATE INDEX "idx_chat_memories_embedding" ON "chat_memories" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "chat_memories"`);
    }
}
