import type { MigrationInterface, QueryRunner } from "typeorm";

export class RenameGoogleAccountsTable1787300000000 implements MigrationInterface {
  name = "RenameGoogleAccountsTable1787300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "google_accounts" RENAME TO "google_calendar_connections"`);
    await queryRunner.query(
      `ALTER INDEX "idx_google_accounts_user_id" RENAME TO "idx_google_calendar_connections_user_id"`
    );
    await queryRunner.query(
      `ALTER INDEX "idx_google_accounts_google_email" RENAME TO "idx_google_calendar_connections_google_email"`
    );
    await queryRunner.query(
      `ALTER TABLE "google_calendar_connections" RENAME CONSTRAINT "fk_google_accounts_user" TO "fk_google_calendar_connections_user"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "google_calendar_connections" RENAME CONSTRAINT "fk_google_calendar_connections_user" TO "fk_google_accounts_user"`
    );
    await queryRunner.query(
      `ALTER INDEX "idx_google_calendar_connections_google_email" RENAME TO "idx_google_accounts_google_email"`
    );
    await queryRunner.query(
      `ALTER INDEX "idx_google_calendar_connections_user_id" RENAME TO "idx_google_accounts_user_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "google_calendar_connections" RENAME TO "google_accounts"`
    );
  }
}
