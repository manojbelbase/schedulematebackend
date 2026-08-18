import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { User } from "../modules/users/user.entity";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: env.databaseUrl,
    synchronize: false,
    logging: !env.isProduction,
    entities: [User],
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