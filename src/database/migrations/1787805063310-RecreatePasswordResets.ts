import type { MigrationInterface, QueryRunner } from "typeorm";

export class RecreatePasswordResets1787805063310 implements MigrationInterface {
  name = "RecreatePasswordResets1787805063310";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_resets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "hashed_otp" text NOT NULL,
        "expires_at" timestamp NOT NULL,
        "used" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_password_resets_user_id" ON "password_resets" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_password_resets_user_used" ON "password_resets" ("user_id", "used")`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_password_resets_user'
        ) THEN
          ALTER TABLE "password_resets" ADD CONSTRAINT "fk_password_resets_user"
            FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "password_resets"`);
  }
}
