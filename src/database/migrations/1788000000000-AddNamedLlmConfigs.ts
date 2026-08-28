import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddNamedLlmConfigs1788000000000 implements MigrationInterface {
    name = "AddNamedLlmConfigs1788000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "llm_config" ADD COLUMN "name" varchar(100)`);
        await queryRunner.query(`ALTER TABLE "llm_config" ADD COLUMN "is_active" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`UPDATE "llm_config" SET "name" = 'Default', "is_active" = true WHERE "id" = '00000000-0000-0000-0000-000000000001'`);
        await queryRunner.query(`ALTER TABLE "llm_config" ALTER COLUMN "name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "llm_config" ADD CONSTRAINT "UQ_llm_config_name" UNIQUE ("name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "llm_config" DROP CONSTRAINT "UQ_llm_config_name"`);
        await queryRunner.query(`ALTER TABLE "llm_config" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "llm_config" DROP COLUMN "name"`);
    }
}
