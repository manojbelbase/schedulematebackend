import { AppDataSource } from "../../config/data-source";
import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { LlmConfig } from "./llmConfig.entity";

const llmConfigRepository = AppDataSource.getRepository(LlmConfig);

const CONFIG_ID = "00000000-0000-0000-0000-000000000001";

export async function findConfigs(): Promise<LlmConfig[]> {
    return await llmConfigRepository.find({ order: { createdAt: "ASC" } });
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
