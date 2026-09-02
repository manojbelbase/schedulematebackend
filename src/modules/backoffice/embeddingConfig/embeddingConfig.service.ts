import { AppError } from "../../../common/errors/AppError";
import { httpStatus } from "../../../constants/httpStatus";
import { buildPagination } from "../../../common/utils/pagination";
import type { ListQueryOptions, Pagination } from "../../../common/utils/pagination";
import { invalidateEmbeddingClients } from "../../../config/embedding";
import { getEmbeddingProviderEntry } from "../../../config/embeddingProviders";
import {
    createConfig,
    deleteConfig,
    findActiveConfig,
    findAllConfigs,
    findConfig,
    updateConfig,
} from "./embeddingConfig.repository";
import type { CreateEmbeddingConfigDto } from "./dto/create-embedding-config.dto";
import type { UpdateEmbeddingConfigDto } from "./dto/update-embedding-config.dto";

export type PublicEmbeddingConfig = {
    id: string;
    name: string;
    isActive: boolean;
    activeProvider: string;
    apiKey: string;
    model: string;
    baseUrl: string;
    dimension: number;
};

function toPublic(config: {
    id: string;
    name: string;
    isActive: boolean;
    activeProvider: string;
    apiKey: string;
    model: string;
    baseUrl: string;
    dimension: number;
}): PublicEmbeddingConfig {
    return {
        id: config.id,
        name: config.name,
        isActive: config.isActive,
        activeProvider: config.activeProvider,
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
        dimension: config.dimension,
    };
}

export async function getEmbeddingConfigService(): Promise<PublicEmbeddingConfig | null> {
    const config = await findActiveConfig();
    if (!config) return null;
    return toPublic(config);
}

export async function listEmbeddingConfigsService(
    query: ListQueryOptions
): Promise<{ items: PublicEmbeddingConfig[]; pagination: Pagination }> {
    const { items, total } = await findAllConfigs(query);
    const pagination = buildPagination(total, query.page, query.take, items.length);
    return { items: items.map(toPublic), pagination };
}

export async function createEmbeddingConfigService(data: CreateEmbeddingConfigDto): Promise<PublicEmbeddingConfig> {
    const entry = getEmbeddingProviderEntry(data.activeProvider);
    if (!entry) {
        throw new AppError("Invalid embedding provider", httpStatus.BAD_REQUEST);
    }

    const payload: Partial<Record<string, string | boolean | number>> = {
        ...data,
        baseUrl: entry.baseUrl,
        model: data.model || entry.defaultModel,
        dimension: entry.dimension,
    };
    const created = await createConfig(payload);
    invalidateEmbeddingClients();
    return toPublic(created);
}

export async function updateEmbeddingConfigService(
    id: string,
    data: UpdateEmbeddingConfigDto
): Promise<PublicEmbeddingConfig> {
    const updated = await updateConfig(id, data as Partial<Record<string, string | boolean | number>>);
    invalidateEmbeddingClients();
    return toPublic(updated);
}

export async function deleteEmbeddingConfigService(id: string): Promise<void> {
    const config = await findConfig(id);
    if (!config) {
        throw new AppError("Embedding config not found", httpStatus.NOT_FOUND);
    }
    await deleteConfig(id);
    invalidateEmbeddingClients();
}
