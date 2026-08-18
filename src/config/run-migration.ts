import { AppDataSource } from "./data-source";
import { logger } from "../lib/logger";

async function runMigrations(): Promise<void> {
    try {
        await AppDataSource.initialize();
        await AppDataSource.runMigrations();
        logger.info("Migrations executed successfully.");
    } catch (error) {
        logger.error({ error }, "Migration failed");
        process.exit(1);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

void runMigrations();