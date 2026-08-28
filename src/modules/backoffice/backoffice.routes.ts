import { Router } from "express";
import { asyncHandler } from "../../common/middleware/asyncHandler";
import { authenticate } from "../../common/middleware/auth";
import { requireAdmin } from "../../common/middleware/auth";
import { validateBody } from "../../common/middleware/validateBody";
import { addUserSchema } from "./dto/add-user.dto";
import { updateUserLimitSchema } from "./dto/update-user-limit.dto";
import {
    listUsersController,
    addUserController,
    deleteUserController,
    updateUserLimitController,
} from "./backoffice.controller";

export const backofficeRouter: Router = Router();

backofficeRouter.use(authenticate());
backofficeRouter.use(requireAdmin());

backofficeRouter.get("/users", asyncHandler(listUsersController));
backofficeRouter.post("/users", validateBody(addUserSchema), asyncHandler(addUserController));
backofficeRouter.delete("/users/:id", asyncHandler(deleteUserController));
backofficeRouter.patch("/users/:id/limit", validateBody(updateUserLimitSchema), asyncHandler(updateUserLimitController));