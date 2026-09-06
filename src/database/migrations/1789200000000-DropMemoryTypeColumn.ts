import type { MigrationInterface, QueryRunner } from "typeorm";

export class DropMemoryTypeColumn1789200000000 implements MigrationInterface {
    name = "DropMemoryTypeColumn1789200000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_memories" DROP COLUMN "memory_type"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "chat_memories" ADD COLUMN "memory_type" character varying(50) NOT NULL DEFAULT 'other'`
        );
    }
}
