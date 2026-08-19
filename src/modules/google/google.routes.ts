import { Router } from "express";
import { asyncHandler } from "../../common/middleware/asyncHandler";
import { authenticate } from "../../common/middleware/auth";
import {
    googleConnectCallbackController,
    googleConnectController,
    googleDisconnectController,
    googleStatusController,
} from "./google.controller";

export const googleRouter: Router = Router();

googleRouter.get("/status", authenticate(), asyncHandler(googleStatusController));
googleRouter.get("/connect", authenticate(), asyncHandler(googleConnectController));
googleRouter.get("/connect/callback", asyncHandler(googleConnectCallbackController));
googleRouter.post("/disconnect", authenticate(), asyncHandler(googleDisconnectController));
