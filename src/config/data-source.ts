import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { User } from "../modules/users/user.entity";
import { PasswordReset } from "../modules/password-reset/password-reset.entity";
import { GoogleAccount } from "../modules/google/google-account.entity";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: env.databaseUrl,
    synchronize: false,
    logging: !env.isProduction,
    entities: [User, PasswordReset, GoogleAccount],
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