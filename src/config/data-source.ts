import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { User } from "../modules/users/user.entity";
import { PasswordReset } from "../modules/passwordReset/passwordReset.entity";
import { CalendarConnection } from "../modules/calendarConnection/calendarConnection.entity";
import { ChatConversation } from "../modules/chat/chat-conversation.entity";
import { ChatMessage } from "../modules/chat/chat-message.entity";
import { LlmConfig } from "../modules/backoffice/llmConfig/llmConfig.entity";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: env.databaseUrl,
    synchronize: false,
    logging: !env.isProduction,
    entities: [User, PasswordReset, CalendarConnection, ChatConversation, ChatMessage, LlmConfig],
    migrations: [import.meta.dirname + "/../database/migrations/*.{ts,js}"],
    migrationsTableName: "migrations",
});

export async function initializeDatabase(): Promise<void> {
    try {
        await AppDataSource.initialize();
    } catch (error) {
        throw error;
    }
}