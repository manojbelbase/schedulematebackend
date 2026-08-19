import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGoogleAccounts1787124905523 implements MigrationInterface {
  name = "CreateGoogleAccounts1787124905523";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "google_accounts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "google_email" character varying(255),
        "access_token" text NOT NULL,
        "refresh_token" text NOT NULL,
        "expires_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_google_accounts_user_id" ON "google_accounts" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_google_accounts_google_email" ON "google_accounts" ("google_email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "google_accounts" ADD CONSTRAINT "fk_google_accounts_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "google_accounts"`);
  }
}
