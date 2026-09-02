import { Router } from "express";
import { asyncHandler } from "../../../common/middleware/asyncHandler";
import { authenticate, requireAdmin } from "../../../common/middleware/auth";
import { validateBody } from "../../../common/middleware/validateBody";
import { createEmbeddingConfigSchema } from "./dto/create-embedding-config.dto";
import { updateEmbeddingConfigSchema } from "./dto/update-embedding-config.dto";
import {
    createEmbeddingConfigController,
    deleteEmbeddingConfigController,
    getEmbeddingConfigController,
    listEmbeddingConfigsController,
    listEmbeddingProvidersController,
    updateEmbeddingConfigController,
} from "./embeddingConfig.controller";

export const embeddingConfigRouter: Router = Router();

embeddingConfigRouter.use(authenticate());
embeddingConfigRouter.use(requireAdmin());

embeddingConfigRouter.get("/", asyncHandler(listEmbeddingConfigsController));
embeddingConfigRouter.get("/providers", asyncHandler(listEmbeddingProvidersController));
embeddingConfigRouter.get("/active", asyncHandler(getEmbeddingConfigController));
embeddingConfigRouter.post(
    "/",
    validateBody(createEmbeddingConfigSchema),
    asyncHandler(createEmbeddingConfigController)
);
embeddingConfigRouter.patch(
    "/:id",
    validateBody(updateEmbeddingConfigSchema),
    asyncHandler(updateEmbeddingConfigController)
);
embeddingConfigRouter.delete("/:id", asyncHandler(deleteEmbeddingConfigController));
