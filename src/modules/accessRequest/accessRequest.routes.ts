import { Router } from "express";
import { asyncHandler } from "../../common/middleware/asyncHandler";
import { authenticate } from "../../common/middleware/auth";
import { validateBody } from "../../common/middleware/validateBody";
import { requestAccessSchema } from "./dto/request-access.dto";
import { getMyAccessRequestController, requestAccessController } from "./accessRequest.controller";

export const accessRequestRouter: Router = Router();

accessRequestRouter.post(
    "/request-access",
    authenticate(),
    validateBody(requestAccessSchema),
    asyncHandler(requestAccessController)
);

accessRequestRouter.get(
    "/me",
    authenticate(),
    asyncHandler(getMyAccessRequestController)
);
