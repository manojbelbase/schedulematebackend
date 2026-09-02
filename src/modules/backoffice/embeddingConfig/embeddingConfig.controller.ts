import type { Request, Response } from "express";
import { httpStatus } from "../../../constants/httpStatus";
import { sendSuccess } from "../../../lib/response";
import { parseListQuery } from "../../../common/utils/pagination";
import { EMBEDDING_PROVIDER_REGISTRY } from "../../../config/embeddingProviders";
import {
    createEmbeddingConfigService,
    deleteEmbeddingConfigService,
    getEmbeddingConfigService,
    listEmbeddingConfigsService,
    updateEmbeddingConfigService,
} from "./embeddingConfig.service";
import type { CreateEmbeddingConfigDto } from "./dto/create-embedding-config.dto";
import type { UpdateEmbeddingConfigDto } from "./dto/update-embedding-config.dto";

export async function listEmbeddingProvidersController(
    _req: Request,
    res: Response
): Promise<void> {
    sendSuccess(res, httpStatus.OK, "Embedding providers fetched successfully", EMBEDDING_PROVIDER_REGISTRY);
}

export async function listEmbeddingConfigsController(req: Request, res: Response): Promise<void> {
    const query = parseListQuery(req.query);
    const result = await listEmbeddingConfigsService(query);
    sendSuccess(
        res,
        httpStatus.OK,
        "Embedding configs fetched successfully",
        result.items,
        result.pagination
    );
}

export async function getEmbeddingConfigController(_req: Request, res: Response): Promise<void> {
    const config = await getEmbeddingConfigService();
    sendSuccess(res, httpStatus.OK, "Active embedding config fetched successfully", config);
}

export async function createEmbeddingConfigController(req: Request, res: Response): Promise<void> {
    const config = await createEmbeddingConfigService(req.body as CreateEmbeddingConfigDto);
    sendSuccess(res, httpStatus.CREATED, "Embedding config created successfully", config);
}

export async function updateEmbeddingConfigController(req: Request, res: Response): Promise<void> {
    const data = req.body as UpdateEmbeddingConfigDto;
    const config = await updateEmbeddingConfigService(req.params.id as string, data);
    sendSuccess(res, httpStatus.OK, "Embedding config updated successfully", config);
}

export async function deleteEmbeddingConfigController(req: Request, res: Response): Promise<void> {
    await deleteEmbeddingConfigService(req.params.id as string);
    sendSuccess(res, httpStatus.OK, "Embedding config deleted successfully", null);
}
