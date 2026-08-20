import cors from "cors";
import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import { env } from "./config/env";
import { swaggerConfig } from "./config/swagger";
import { docsAuth } from "./common/middleware/docsAuth";
import { errorHandler } from "./common/middleware/errorHandler";
import { notFound } from "./common/middleware/notFound";
import { healthRouter } from "./modules/health/health.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { docsRouter } from "./modules/docs/docs.routes";
import { calendarConnectionRouter } from "./modules/calendar-connection/calendar-connection.routes";

export function createApp(): Express {
    const app = express();

    app.use(cors({ origin: env.corsOrigins, credentials: true }));
    app.use(cookieParser());
    app.use(express.json());

    app.get("/docs-json", docsAuth, (_req, res) => {
        res.json(swaggerConfig);
    });
    app.use("/api-docs", docsAuth, docsRouter);

    app.use("/api/health", healthRouter);
    app.use("/api/auth", authRouter);
    app.use("/api/calendar-connection", calendarConnectionRouter);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}