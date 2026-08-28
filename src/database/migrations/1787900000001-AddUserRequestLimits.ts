import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRequestLimits1787900000001 implements MigrationInterface {
    name = "AddUserRequestLimits1787900000001";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN "api_request_limit" integer NOT NULL DEFAULT 10`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN "api_requests_used" integer NOT NULL DEFAULT 0`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "api_requests_used"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "api_request_limit"`);
    }
}
