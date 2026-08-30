import { Router } from "express";
import { asyncHandler } from "../../../common/middleware/asyncHandler";
import { authenticate } from "../../../common/middleware/auth";
import { requireAdmin } from "../../../common/middleware/auth";
import { validateBody } from "../../../common/middleware/validateBody";
import { addUserSchema } from "./dto/add-user.dto";
import { updateUserLimitSchema } from "./dto/update-user-limit.dto";
import {
    listUsersController,
    addUserController,
    deleteUserController,
    updateUserLimitController,
} from "./user.controller";

export const userRouter: Router = Router();

userRouter.use(authenticate());
userRouter.use(requireAdmin());

userRouter.get("/", asyncHandler(listUsersController));
userRouter.post("/", validateBody(addUserSchema), asyncHandler(addUserController));
userRouter.delete("/:id", asyncHandler(deleteUserController));
userRouter.patch("/:id/limit", validateBody(updateUserLimitSchema), asyncHandler(updateUserLimitController));