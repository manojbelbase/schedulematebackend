import { AppDataSource } from "../../../config/data-source";
import { AppError } from "../../../common/errors/AppError";
import { httpStatus } from "../../../constants/httpStatus";
import { EmbeddingConfig } from "./embeddingConfig.entity";
import type { ListQueryOptions } from "../../../common/utils/pagination";

const embeddingConfigRepository = AppDataSource.getRepository(EmbeddingConfig);

const ALLOWED_SORT_COLUMNS = ["name", "createdAt", "updatedAt"];

export async function findAllConfigs(query: ListQueryOptions): Promise<{ items: EmbeddingConfig[]; total: number }> {
    const qb = embeddingConfigRepository.createQueryBuilder("config");

    if (query.query) {
        qb.andWhere("config.name ILIKE :query", { query: `%${query.query}%` });
    }

    if (query.dateFrom) {
        qb.andWhere("config.createdAt >= :dateFrom", { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
        qb.andWhere("config.createdAt <= :dateTo", { dateTo: query.dateTo });
    }

    const total = await qb.getCount();

    const sortBy = ALLOWED_SORT_COLUMNS.includes(query.sortBy) ? query.sortBy : "createdAt";
    qb.orderBy(`config.${sortBy}`, query.sortOrder);
    qb.skip(query.page * query.take).take(query.take);

    const items = await qb.getMany();

    return { items, total };
}

export async function findConfig(id: string): Promise<EmbeddingConfig | null> {
    return await embeddingConfigRepository.findOne({ where: { id } });
}

export async function findActiveConfig(): Promise<EmbeddingConfig | null> {
    return await embeddingConfigRepository.findOne({ where: { isActive: true } });
}

export async function findConfigByProvider(provider: string): Promise<EmbeddingConfig | null> {
    return await embeddingConfigRepository.findOne({ where: { activeProvider: provider } });
}

async function deactivateConfigs(): Promise<void> {
    await embeddingConfigRepository
        .createQueryBuilder()
        .update(EmbeddingConfig)
        .set({ isActive: false })
        .where("is_active = :isActive", { isActive: true })
        .execute();
}

export async function createConfig(data: Partial<EmbeddingConfig>): Promise<EmbeddingConfig> {
    if (data.isActive) await deactivateConfigs();
    const config = embeddingConfigRepository.create(data);
    return await embeddingConfigRepository.save(config);
}

export async function updateConfig(id: string, data: Partial<EmbeddingConfig>): Promise<EmbeddingConfig> {
    const config = await findConfig(id);
    if (!config) throw new AppError("Embedding config not found", httpStatus.NOT_FOUND);

    if (data.isActive) await deactivateConfigs();
    Object.assign(config, data);
    return await embeddingConfigRepository.save(config);
}

export async function deleteConfig(id: string): Promise<void> {
    await embeddingConfigRepository.delete(id);
}
