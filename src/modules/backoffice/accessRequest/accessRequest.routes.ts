import { Router } from "express";
import { asyncHandler } from "../../../common/middleware/asyncHandler";
import { authenticate } from "../../../common/middleware/auth";
import { requireAdmin } from "../../../common/middleware/auth";
import { validateBody } from "../../../common/middleware/validateBody";
import { updateAccessRequestStatusSchema } from "./dto/update-access-request-status.dto";
import {
    listAccessRequestsController,
    updateAccessRequestStatusController,
} from "./accessRequest.controller";

export const accessRequestRouter: Router = Router();

accessRequestRouter.use(authenticate());
accessRequestRouter.use(requireAdmin());

accessRequestRouter.get("/", asyncHandler(listAccessRequestsController));
accessRequestRouter.patch(
    "/:id/status",
    validateBody(updateAccessRequestStatusSchema),
    asyncHandler(updateAccessRequestStatusController)
);
