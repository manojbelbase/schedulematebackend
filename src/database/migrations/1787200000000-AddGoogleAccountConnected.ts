import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddGoogleAccountConnected1787200000000 implements MigrationInterface {
  name = "AddGoogleAccountConnected1787200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "google_accounts" ADD COLUMN "connected" boolean NOT NULL DEFAULT true`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "google_accounts" DROP COLUMN "connected"`);
  }
}
