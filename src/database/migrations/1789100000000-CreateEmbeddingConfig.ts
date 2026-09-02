import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEmbeddingConfig1789100000000 implements MigrationInterface {
    name = "CreateEmbeddingConfig1789100000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "embedding_config" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" varchar(100) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT false,
                "active_provider" varchar(100) NOT NULL DEFAULT 'openrouter',
                "api_key" varchar(500) NOT NULL DEFAULT '',
                "model" varchar(200) NOT NULL DEFAULT '',
                "base_url" varchar(500) NOT NULL DEFAULT '',
                "dimension" integer NOT NULL DEFAULT 1536,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `);

        await queryRunner.query(
            `ALTER TABLE "embedding_config" ADD CONSTRAINT "UQ_embedding_config_name" UNIQUE ("name")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "embedding_config"`);
    }
}