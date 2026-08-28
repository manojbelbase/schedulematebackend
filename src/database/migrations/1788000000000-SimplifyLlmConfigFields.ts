import type { MigrationInterface, QueryRunner } from "typeorm";

export class SimplifyLlmConfigFields1788000000000 implements MigrationInterface {
    name = "SimplifyLlmConfigFields1788000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "llm_config" ALTER COLUMN "active_provider" TYPE varchar(100)`
        );
        await queryRunner.query(
            `ALTER TABLE "llm_config" ADD COLUMN "api_key" varchar(500) NOT NULL DEFAULT ''`
        );
        await queryRunner.query(
            `ALTER TABLE "llm_config" ADD COLUMN "model" varchar(200) NOT NULL DEFAULT ''`
        );
        await queryRunner.query(
            `ALTER TABLE "llm_config" ADD COLUMN "base_url" varchar(500) NOT NULL DEFAULT ''`
        );
        await queryRunner.query(`
            UPDATE "llm_config"
            SET "api_key" = CASE
                    WHEN "active_provider" = 'openrouter' THEN "openrouter_api_key"
                    ELSE "deepseek_api_key"
                END,
                "model" = CASE
                    WHEN "active_provider" = 'openrouter' THEN "openrouter_model"
                    ELSE "deepseek_model"
                END,
                "base_url" = CASE
                    WHEN "active_provider" = 'openrouter' THEN "openrouter_base_url"
                    ELSE "deepseek_base_url"
                END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "llm_config" DROP COLUMN "base_url"`);
        await queryRunner.query(`ALTER TABLE "llm_config" DROP COLUMN "model"`);
        await queryRunner.query(`ALTER TABLE "llm_config" DROP COLUMN "api_key"`);
        await queryRunner.query(
            `ALTER TABLE "llm_config" ALTER COLUMN "active_provider" TYPE varchar(20)`
        );
    }
}
