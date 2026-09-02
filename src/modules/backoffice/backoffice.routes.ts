import { Router } from "express";
import { authenticate } from "../../common/middleware/auth";
import { requireAdmin } from "../../common/middleware/auth";
import { dashboardRouter } from "./dashboard/dashboard.routes";
import { userRouter } from "./user/user.routes";
import { accessRequestRouter } from "./accessRequest/accessRequest.routes";
import { llmConfigRouter } from "./llmConfig/llmConfig.routes";
import { embeddingConfigRouter } from "./embeddingConfig/embeddingConfig.routes";

export const backofficeRouter: Router = Router();

backofficeRouter.use(authenticate());
backofficeRouter.use(requireAdmin());

backofficeRouter.use("/dashboard", dashboardRouter);
backofficeRouter.use("/users", userRouter);
backofficeRouter.use("/access-requests", accessRequestRouter);
backofficeRouter.use("/llm-config", llmConfigRouter);
backofficeRouter.use("/embedding-config", embeddingConfigRouter);