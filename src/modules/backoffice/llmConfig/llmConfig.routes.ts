import { Router } from "express";
import { asyncHandler } from "../../../common/middleware/asyncHandler";
import { authenticate, requireAdmin } from "../../../common/middleware/auth";
import { validateBody } from "../../../common/middleware/validateBody";
import { createLlmConfigSchema } from "./dto/create-llm-config.dto";
import { updateLlmConfigSchema } from "./dto/update-llm-config.dto";
import {
    createLlmConfigController,
    deleteLlmConfigController,
    getLlmConfigController,
    listLlmConfigsController,
    listLlmProvidersController,
    updateLlmConfigController,
} from "./llmConfig.controller";

export const llmConfigRouter: Router = Router();

llmConfigRouter.use(authenticate());
llmConfigRouter.use(requireAdmin());

llmConfigRouter.get("/", asyncHandler(listLlmConfigsController));
llmConfigRouter.get("/providers", asyncHandler(listLlmProvidersController));
llmConfigRouter.get("/active", asyncHandler(getLlmConfigController));
llmConfigRouter.post("/", validateBody(createLlmConfigSchema), asyncHandler(createLlmConfigController));
llmConfigRouter.patch("/:id", validateBody(updateLlmConfigSchema), asyncHandler(updateLlmConfigController));
llmConfigRouter.delete("/:id", asyncHandler(deleteLlmConfigController));
