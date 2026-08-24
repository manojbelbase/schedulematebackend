import OpenAI from "openai";
import { env } from "./env";
import { AppError } from "../common/errors/AppError";
import { httpStatus } from "../constants/httpStatus";

const LLM_PROVIDERS = ["deepseek", "openrouter"] as const;
type LlmProvider = (typeof LLM_PROVIDERS)[number];

type ProviderConfig = {
    apiKey: string;
    model: string;
    baseUrl?: string;
    defaultHeaders?: Record<string, string>;
};

const providerConfigs: Record<LlmProvider, ProviderConfig> = {
    deepseek: {
        apiKey: env.deepseekApiKey,
        model: env.deepseekModel,
        baseUrl: env.deepseekBaseUrl,
        defaultHeaders: {},
    },
    openrouter: {
        apiKey: env.openrouterApiKey,
        model: env.openrouterModel,
        baseUrl: env.openrouterBaseUrl,
        defaultHeaders: {
            "HTTP-Referer": env.frontendUrl,
            "X-Title": "ScheduledMate",
        },
    },
};

function getDefaultLlmProvider(): LlmProvider {
    const value = env.llmDefaultProvider as LlmProvider;
    return providerConfigs[value] ? value : "deepseek";
}

function isSupportedProvider(value: string): value is LlmProvider {
    return value in providerConfigs;
}

export function resolveLlmProvider(provider?: string): LlmProvider {
    if (!provider) {
        return getDefaultLlmProvider();
    }
    if (!isSupportedProvider(provider)) {
        throw new AppError(
            `Unsupported LLM provider "${provider}". Supported: ${LLM_PROVIDERS.join(", ")}`,
            httpStatus.BAD_REQUEST
        );
    }
    return provider;
}

const clients: Partial<Record<LlmProvider, OpenAI>> = {};

export function getLlmClient(provider: LlmProvider): OpenAI {
    if (!clients[provider]) {
        const config = providerConfigs[provider];
        if (!config.apiKey) {
            throw new AppError(
                `API key is not configured for the LLM provider "${provider}"`,
                httpStatus.BAD_GATEWAY
            );
        }
        clients[provider] = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
            defaultHeaders: config.defaultHeaders,
        });
    }
    return clients[provider] as OpenAI;
}

export function getModelForProvider(provider: LlmProvider): string {
    return providerConfigs[provider].model;
}
