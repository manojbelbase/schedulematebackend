import OpenAI from "openai";
import { env } from "./env";
import { AppError } from "../common/errors/AppError";
import { httpStatus } from "../constants/httpStatus";
import { findActiveConfig } from "../modules/backoffice/llmConfig/llmConfig.repository";
import type { LlmConfig } from "../modules/backoffice/llmConfig/llmConfig.entity";
import { getProviderRegistryEntry } from "./llmProviders";

export type LlmProvider = string;

type ProviderConfig = {
    apiKey: string;
    model: string;
    baseUrl?: string;
    defaultHeaders?: Record<string, string>;
};

function buildDefaultHeaders(provider: LlmProvider): Record<string, string> {
    const entry = getProviderRegistryEntry(provider);
    if (entry?.requiresReferer) {
        return {
            "HTTP-Referer": env.frontendUrl,
            "X-Title": "ScheduleGPT",
        };
    }
    return {};
}

async function getConfigForProvider(provider: LlmProvider): Promise<LlmConfig | null> {
    const active = await findActiveConfig();
    return active?.activeProvider === provider ? active : null;
}

export async function resolveLlmProvider(provider?: string): Promise<LlmProvider> {
    if (provider) return provider;
    const active = await findActiveConfig();
    return active?.activeProvider || "deepseek";
}

const clients: Record<string, OpenAI> = {};

export function invalidateLlmClients(): void {
    for (const key of Object.keys(clients)) {
        delete clients[key];
    }
}

export async function getLlmClient(provider: LlmProvider): Promise<OpenAI> {
    const config = await getConfigForProvider(provider);
    const entry = getProviderRegistryEntry(provider);

    const apiKey = config?.apiKey || "";
    const model = config?.model || entry?.defaultModel || "";
    const baseUrl = config?.baseUrl || entry?.baseUrl || "";

    if (!apiKey) {
        throw new AppError(
            `API key is not configured for the LLM provider "${provider}". Configure it in the backoffice.`,
            httpStatus.BAD_GATEWAY
        );
    }

    const existing = clients[provider];
    if (existing) {
        const cachedKey = (existing as unknown as { apiKey?: string }).apiKey;
        if (cachedKey === apiKey) {
            return existing;
        }
        delete clients[provider];
    }

    const client = new OpenAI({
        apiKey,
        baseURL: baseUrl,
        defaultHeaders: buildDefaultHeaders(provider),
    });
    clients[provider] = client;
    return client;
}

export async function getModelForProvider(provider: LlmProvider): Promise<string> {
    const config = await getConfigForProvider(provider);
    if (config?.model) return config.model;
    return getProviderRegistryEntry(provider)?.defaultModel || provider;
}
