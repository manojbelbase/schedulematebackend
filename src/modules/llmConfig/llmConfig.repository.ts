import { AppDataSource } from "../../config/data-source";
import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { LlmConfig } from "./llmConfig.entity";
import type { ListQueryOptions } from "../../common/utils/pagination";

const llmConfigRepository = AppDataSource.getRepository(LlmConfig);


const ALLOWED_SORT_COLUMNS = ["name", "createdAt", "updatedAt"];

export async function findAllConfigs(query: ListQueryOptions): Promise<{ items: LlmConfig[]; total: number }> {
    const qb = llmConfigRepository.createQueryBuilder("config");

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

export async function findConfig(id: string): Promise<LlmConfig | null> {
    return await llmConfigRepository.findOne({ where: { id } });
}

export async function findActiveConfig(): Promise<LlmConfig | null> {
    return await llmConfigRepository.findOne({ where: { isActive: true } });
}

export async function findConfigByProvider(provider: string): Promise<LlmConfig | null> {
    return await llmConfigRepository.findOne({ where: { activeProvider: provider } });
}

async function deactivateConfigs(): Promise<void> {
    await llmConfigRepository
        .createQueryBuilder()
        .update(LlmConfig)
        .set({ isActive: false })
        .where("is_active = :isActive", { isActive: true })
        .execute();
}

export async function createConfig(data: Partial<LlmConfig>): Promise<LlmConfig> {
    if (data.isActive) await deactivateConfigs();
    const config = llmConfigRepository.create(data);
    return await llmConfigRepository.save(config);
}

export async function updateConfig(id: string, data: Partial<LlmConfig>): Promise<LlmConfig> {
    const config = await findConfig(id);
    if (!config) throw new AppError("LLM config not found", httpStatus.NOT_FOUND);

    if (data.isActive) await deactivateConfigs();
    Object.assign(config, data);
    return await llmConfigRepository.save(config);
}

export async function deleteConfig(id: string): Promise<void> {
    await llmConfigRepository.delete(id);
}
