import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePasswordResets1787060065576 implements MigrationInterface {
  name = "CreatePasswordResets1787060065576";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_resets" (
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
      `CREATE INDEX "idx_password_resets_user_id" ON "password_resets" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_password_resets_user_used" ON "password_resets" ("user_id", "used")`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_resets" ADD CONSTRAINT "fk_password_resets_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "password_resets"`);
  }
}
