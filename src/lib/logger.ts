import pino from "pino";
import { env } from "../config/env";

const options: pino.LoggerOptions = {
    level: env.logLevel,
};

if (!env.isProduction) {
    options.transport = {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
        },
    };
}

export const logger = pino(options);