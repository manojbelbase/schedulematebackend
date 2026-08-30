import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { buildPagination } from "../../common/utils/pagination";
import type { ListQueryOptions, Pagination } from "../../common/utils/pagination";
import { invalidateLlmClients } from "../../config/llm";
import { getProviderRegistryEntry } from "../../config/llmProviders";
import { createConfig, deleteConfig, findActiveConfig, findAllConfigs, findConfig, updateConfig } from "./llmConfig.repository";
import type { CreateLlmConfigDto } from "./dto/create-llm-config.dto";
import type { UpdateLlmConfigDto } from "./dto/update-llm-config.dto";

export type PublicLlmConfig = {
    id: string;
    name: string;
    isActive: boolean;
    activeProvider: string;
    apiKey: string;
    model: string;
    baseUrl: string;
};

function toPublic(config: {
    id: string;
    name: string;
    isActive: boolean;
    activeProvider: string;
    apiKey: string;
    model: string;
    baseUrl: string;
}): PublicLlmConfig {
    return {
        id: config.id,
        name: config.name,
        isActive: config.isActive,
        activeProvider: config.activeProvider,
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
    };
}

export async function getLlmConfigService(): Promise<PublicLlmConfig | null> {
    const config = await findActiveConfig();
    if (!config) return null;
    return toPublic(config);
}

export async function listLlmConfigsService(
    query: ListQueryOptions
): Promise<{ items: PublicLlmConfig[]; pagination: Pagination }> {
    const { items, total } = await findAllConfigs(query);
    const pagination = buildPagination(total, query.page, query.take, items.length);
    return { items: items.map(toPublic), pagination };
}

export async function createLlmConfigService(data: CreateLlmConfigDto): Promise<PublicLlmConfig> {
    const entry = getProviderRegistryEntry(data.activeProvider);
    const payload: Partial<Record<string, string | boolean>> = {
        ...data,
        baseUrl: entry?.baseUrl ?? "",
        model: data.model || entry?.defaultModel || "",
    };
    const created = await createConfig(payload);
    invalidateLlmClients();
    return toPublic(created);
}

export async function updateLlmConfigService(
    id: string,
    data: UpdateLlmConfigDto
): Promise<PublicLlmConfig> {
    const updated = await updateConfig(id, data as Partial<Record<string, string | boolean>>);
    invalidateLlmClients();
    return toPublic(updated);
}

export async function deleteLlmConfigService(id: string): Promise<void> {
    const config = await findConfig(id);
    if (!config) {
        throw new AppError("LLM config not found", httpStatus.NOT_FOUND);
    }
    await deleteConfig(id);
    invalidateLlmClients();
}
