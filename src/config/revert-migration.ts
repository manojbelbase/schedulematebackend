import { AppDataSource } from "./data-source";
import { logger } from "../lib/logger";

async function revertMigrations(): Promise<void> {
    try {
        await AppDataSource.initialize();
        await AppDataSource.undoLastMigration();
        logger.info("Last migration reverted successfully.");
    } catch (error) {
        logger.error({ error }, "Migration revert failed");
        process.exit(1);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

void revertMigrations();