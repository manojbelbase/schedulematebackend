import OpenAI from "openai";
import { env } from "./env";

let openRouterClient: OpenAI | null = null;

export function getOpenRouterClient(): OpenAI {
    if (!env.openrouterApiKey) {
        throw new Error("Missing required environment variable: OPENROUTER_API_KEY");
    }
    if (!openRouterClient) {
        openRouterClient = new OpenAI({
            apiKey: env.openrouterApiKey,
            baseURL: env.openrouterBaseUrl,
            defaultHeaders: {
                "HTTP-Referer": env.frontendUrl,
                "X-Title": "ScheduledMate",
            },
        });
    }
    return openRouterClient;
}