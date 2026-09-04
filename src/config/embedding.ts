import { env } from "./env";
import { AppError } from "../common/errors/AppError";
import { httpStatus } from "../constants/httpStatus";
import { logger } from "../lib/logger";
import { findActiveConfig } from "../modules/backoffice/embeddingConfig/embeddingConfig.repository";
import type { EmbeddingConfig } from "../modules/backoffice/embeddingConfig/embeddingConfig.entity";
import { getEmbeddingProviderEntry } from "./embeddingProviders";

type ProviderConfig = {
    apiKey: string;
    model: string;
    baseUrl: string;
    dimension: number;
    defaultHeaders?: Record<string, string>;
};

function buildDefaultHeaders(provider: string): Record<string, string> {
    const entry = getEmbeddingProviderEntry(provider);
    if (entry?.requiresReferer) {
        return {
            "HTTP-Referer": env.frontendUrl,
            "X-Title": "ScheduleGPT",
        };
    }
    return {};
}

async function getConfigForProvider(provider: string): Promise<EmbeddingConfig | null> {
    const active = await findActiveConfig();
    return active?.activeProvider === provider ? active : null;
}

const embeddingClients: Record<string, ProviderConfig> = {};

export function invalidateEmbeddingClients(): void {
    for (const key of Object.keys(embeddingClients)) {
        delete embeddingClients[key];
    }
}

async function getEmbeddingProviderConfig(provider: string): Promise<ProviderConfig> {
    if (embeddingClients[provider]) {
        return embeddingClients[provider];
    }

    const config = await getConfigForProvider(provider);
    const entry = getEmbeddingProviderEntry(provider);

    const apiKey = config?.apiKey || "";
    const model = config?.model || entry?.defaultModel || "";
    const baseUrl = config?.baseUrl || entry?.baseUrl || "";
    const dimension = config?.dimension || entry?.dimension || 1536;

    if (!apiKey) {
        throw new AppError(
            `API key is not configured for the embedding provider "${provider}". Configure it in the backoffice.`,
            httpStatus.BAD_GATEWAY
        );
    }

    const providerConfig: ProviderConfig = {
        apiKey,
        model,
        baseUrl,
        dimension,
        defaultHeaders: buildDefaultHeaders(provider),
    };

    embeddingClients[provider] = providerConfig;
    return providerConfig;
}

export async function generateEmbedding(text: string, provider: string = "openrouter"): Promise<number[]> {
    try {
        const config = await getEmbeddingProviderConfig(provider);

        const response = await fetch(`${config.baseUrl}/embeddings`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.apiKey}`,
                "Content-Type": "application/json",
                ...config.defaultHeaders,
            },
            body: JSON.stringify({
                model: config.model,
                input: text,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            logger.error(
                { status: response.status, errorData },
                "Embedding provider request failed"
            );

            if (response.status === 401 || response.status === 403) {
                throw new AppError(
                    "Embedding provider API key is invalid. Please check the backoffice configuration.",
                    httpStatus.BAD_GATEWAY
                );
            }

            if (response.status === 429) {
                throw new AppError(
                    "Embedding provider rate limit exceeded. Please try again later.",
                    httpStatus.TOO_MANY_REQUESTS
                );
            }

            throw new AppError(
                "Embedding provider is currently unavailable. Please try again later.",
                httpStatus.BAD_GATEWAY
            );
        }

        const data = await response.json() as { data?: Array<{ embedding: number[] }> };
        const embedding = data.data?.[0]?.embedding;

        if (!embedding || !Array.isArray(embedding)) {
            logger.error({ data }, "Invalid embedding response format");
            throw new AppError(
                "Invalid response from embedding provider.",
                httpStatus.BAD_GATEWAY
            );
        }

        return embedding;
    } catch (err) {
        if (err instanceof AppError) {
            throw err;
        }

        logger.error({ err }, "Embedding generation failed");
        throw new AppError(
            "Failed to generate embedding. Please try again later.",
            httpStatus.BAD_GATEWAY
        );
    }
}

export async function getEmbeddingDimension(provider: string = "openrouter"): Promise<number> {
    const config = await getEmbeddingProviderConfig(provider);
    return config.dimension;
}
