import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLlmConfig1787900000000 implements MigrationInterface {
    name = "CreateLlmConfig1787900000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "llm_config" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "active_provider" varchar(20) NOT NULL DEFAULT 'deepseek',
                "deepseek_api_key" varchar(500) NOT NULL DEFAULT '',
                "deepseek_model" varchar(100) NOT NULL DEFAULT 'deepseek-chat',
                "deepseek_base_url" varchar(500) NOT NULL DEFAULT 'https://api.deepseek.com',
                "openrouter_api_key" varchar(500) NOT NULL DEFAULT '',
                "openrouter_model" varchar(200) NOT NULL DEFAULT 'google/gemma-4-26b-a4b-it:free',
                "openrouter_base_url" varchar(500) NOT NULL DEFAULT 'https://openrouter.ai/api/v1',
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `);

        await queryRunner.query(`
            INSERT INTO "llm_config" ("id", "active_provider")
            VALUES ('00000000-0000-0000-0000-000000000001', 'deepseek')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "llm_config"`);
    }
}
