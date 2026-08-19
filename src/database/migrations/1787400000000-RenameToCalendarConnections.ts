import type { MigrationInterface, QueryRunner } from "typeorm";

export class RenameToCalendarConnections1787400000000 implements MigrationInterface {
  name = "RenameToCalendarConnections1787400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "google_calendar_connections" RENAME TO "calendar_connections"`
    );
    await queryRunner.query(
      `ALTER INDEX "idx_google_calendar_connections_user_id" RENAME TO "idx_calendar_connections_user_id"`
    );
    await queryRunner.query(
      `ALTER INDEX "idx_google_calendar_connections_google_email" RENAME TO "idx_calendar_connections_google_email"`
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_connections" RENAME CONSTRAINT "fk_google_calendar_connections_user" TO "fk_calendar_connections_user"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar_connections" RENAME CONSTRAINT "fk_calendar_connections_user" TO "fk_google_calendar_connections_user"`
    );
    await queryRunner.query(
      `ALTER INDEX "idx_calendar_connections_google_email" RENAME TO "idx_google_calendar_connections_google_email"`
    );
    await queryRunner.query(
      `ALTER INDEX "idx_calendar_connections_user_id" RENAME TO "idx_google_calendar_connections_user_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_connections" RENAME TO "google_calendar_connections"`
    );
  }
}
