import { createApp } from "./app";
import { env } from "./config/env";
import { initializeDatabase } from "./config/data-source";
import { logger } from "./lib/logger";

async function bootstrap(): Promise<void> {
    try {
        await initializeDatabase();
        logger.info("Database connected and migrations run");

        const app = createApp();
        const server = app.listen(env.port, () => {
            logger.info(`API server listening on http://localhost:${env.port}`);
            logger.info(`OpenAPI docs: http://localhost:${env.port}/api-docs`);
            logger.info(`OpenAPI JSON: http://localhost:${env.port}/docs-json`);
        });

        const shutdown = async (signal: string): Promise<void> => {
            logger.info(`${signal} received, shutting down gracefully...`);
            const forceExit = setTimeout(() => {
                logger.warn("Graceful shutdown timed out; forcing exit.");
                process.exit(1);
            }, 10_000);
            forceExit.unref();

            server.close(async () => {
                clearTimeout(forceExit);
                logger.info("HTTP server closed");
                process.exit(0);
            });
        };

        process.on("SIGINT", () => void shutdown("SIGINT"));
        process.on("SIGTERM", () => void shutdown("SIGTERM"));
    } catch (error) {
        logger.error({ error }, "Failed to bootstrap server");
        process.exit(1);
    }
}

void bootstrap();