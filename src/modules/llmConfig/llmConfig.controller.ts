import type { Request, Response } from "express";
import { httpStatus } from "../../constants/httpStatus";
import { sendSuccess } from "../../lib/response";
import { parseListQuery } from "../../common/utils/pagination";
import { LLM_PROVIDER_REGISTRY } from "../../config/llmProviders";
import {
    createLlmConfigService,
    deleteLlmConfigService,
    getLlmConfigService,
    listLlmConfigsService,
    updateLlmConfigService,
} from "./llmConfig.service";
import type { CreateLlmConfigDto } from "./dto/create-llm-config.dto";
import type { UpdateLlmConfigDto } from "./dto/update-llm-config.dto";

export async function listLlmProvidersController(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, httpStatus.OK, "LLM providers fetched successfully", LLM_PROVIDER_REGISTRY);
}

export async function listLlmConfigsController(req: Request, res: Response): Promise<void> {
    const query = parseListQuery(req.query);
    const result = await listLlmConfigsService(query);
    sendSuccess(res, httpStatus.OK, "LLM configs fetched successfully", result.items, result.pagination);
}

export async function getLlmConfigController(_req: Request, res: Response): Promise<void> {
    const config = await getLlmConfigService();
    sendSuccess(res, httpStatus.OK, "Active LLM config fetched successfully", config);
}

export async function createLlmConfigController(req: Request, res: Response): Promise<void> {
    const config = await createLlmConfigService(req.body as CreateLlmConfigDto);
    sendSuccess(res, httpStatus.CREATED, "LLM config created successfully", config);
}

export async function updateLlmConfigController(req: Request, res: Response): Promise<void> {
    const data = req.body as UpdateLlmConfigDto;
    const config = await updateLlmConfigService(req.params.id as string, data);
    sendSuccess(res, httpStatus.OK, "LLM config updated successfully", config);
}

export async function deleteLlmConfigController(req: Request, res: Response): Promise<void> {
    await deleteLlmConfigService(req.params.id as string);
    sendSuccess(res, httpStatus.OK, "LLM config deleted successfully", null);
}
