import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChatConversations1787600000000 implements MigrationInterface {
  name = "CreateChatConversations1787600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chat_conversations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "title" character varying(255) NOT NULL DEFAULT 'New conversation',
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_chat_conversations_user_id" ON "chat_conversations" ("user_id")`,
    );
    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "conversation_id" uuid NOT NULL,
        "role" character varying(20) NOT NULL,
        "content" text NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_chat_messages_conversation_id" ON "chat_messages" ("conversation_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD CONSTRAINT "fk_chat_messages_conversation" FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_messages" DROP CONSTRAINT "fk_chat_messages_conversation"`,
    );
    await queryRunner.query(`DROP TABLE "chat_messages"`);
    await queryRunner.query(`DROP TABLE "chat_conversations"`);
  }
}