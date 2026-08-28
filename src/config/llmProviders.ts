export type LlmProviderRegistryEntry = {
    key: string;
    label: string;
    baseUrl: string;
    defaultModel: string;
    models: string[];
    requiresReferer?: boolean;
};

export const LLM_PROVIDER_REGISTRY: LlmProviderRegistryEntry[] = [
    {
        key: "deepseek",
        label: "DeepSeek",
        baseUrl: "https://api.deepseek.com",
        defaultModel: "deepseek-chat",
        models: ["deepseek-chat", "deepseek-reasoner"],
    },
    {
        key: "openrouter",
        label: "OpenRouter",
        baseUrl: "https://openrouter.ai/api/v1",
        defaultModel: "google/gemma-4-26b-a4b-it:free",
        models: [
            "google/gemma-4-26b-a4b-it:free",
            "openai/gpt-4o-mini",
            "openai/gpt-4o",
            "anthropic/claude-sonnet-4-5",
            "anthropic/claude-3-7-sonnet",
            "deepseek/deepseek-chat",
        ],
        requiresReferer: true,
    },
    {
        key: "openai",
        label: "OpenAI",
        baseUrl: "https://api.openai.com/v1",
        defaultModel: "gpt-4o-mini",
        models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "o3-mini"],
    },
    {
        key: "google",
        label: "Google Gemini",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
        defaultModel: "gemini-2.0-flash",
        models: [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
        ],
    },
    {
        key: "grok",
        label: "xAI Grok",
        baseUrl: "https://api.x.ai/v1",
        defaultModel: "grok-2-latest",
        models: ["grok-2-latest", "grok-2", "grok-beta"],
    },
    {
        key: "anthropic",
        label: "Anthropic",
        baseUrl: "https://api.anthropic.com/v1",
        defaultModel: "claude-sonnet-4-5",
        models: [
            "claude-sonnet-4-5",
            "claude-sonnet-4",
            "claude-haiku-4-5",
            "claude-3-7-sonnet",
        ],
    },
];

export const LLM_PROVIDER_KEYS = LLM_PROVIDER_REGISTRY.map((p) => p.key);

export function getProviderRegistryEntry(
    key: string
): LlmProviderRegistryEntry | undefined {
    return LLM_PROVIDER_REGISTRY.find((p) => p.key === key);
}
