export type EmbeddingProviderRegistryEntry = {
    key: string;
    label: string;
    baseUrl: string;
    defaultModel: string;
    models: string[];
    dimension: number;
    requiresReferer?: boolean;
};

export const EMBEDDING_PROVIDER_REGISTRY: EmbeddingProviderRegistryEntry[] = [
    {
        key: "openrouter",
        label: "OpenRouter",
        baseUrl: "https://openrouter.ai/api/v1",
        defaultModel: "openai/text-embedding-3-small",
        models: [
            "openai/text-embedding-3-small",
            "openai/text-embedding-3-large",
            "google/gemini-embedding-2-preview",
            "qwen/qwen3-embedding-8b",
            "google/gemini-embedding-2"
        ],
        dimension: 1536,
        requiresReferer: true,
    },
    {
        key: "openai",
        label: "OpenAI",
        baseUrl: "https://api.openai.com/v1",
        defaultModel: "text-embedding-3-small",
        models: [
            "text-embedding-3-small",
            "text-embedding-3-large",
        ],
        dimension: 1536,
    },
];

export const EMBEDDING_PROVIDER_KEYS = EMBEDDING_PROVIDER_REGISTRY.map((p) => p.key);

export function getEmbeddingProviderEntry(
    key: string
): EmbeddingProviderRegistryEntry | undefined {
    return EMBEDDING_PROVIDER_REGISTRY.find((p) => p.key === key);
}
