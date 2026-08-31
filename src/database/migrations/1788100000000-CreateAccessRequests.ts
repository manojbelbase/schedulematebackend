import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAccessRequests1788100000000 implements MigrationInterface {
  name = "CreateAccessRequests1788100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "access_requests" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "requester_email" character varying(255) NOT NULL, "requester_name" character varying(100), "message" text, "status" character varying(20) NOT NULL DEFAULT 'pending')`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_access_requests_user_id" ON "access_requests" ("user_id")`
    );
    await queryRunner.query(
      `ALTER TABLE "access_requests" ADD CONSTRAINT "fk_access_requests_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "access_requests" DROP CONSTRAINT "fk_access_requests_user"`
    );
    await queryRunner.query(`DROP INDEX "idx_access_requests_user_id"`);
    await queryRunner.query(`DROP TABLE "access_requests"`);
  }
}
