import { Router } from "express";
import { asyncHandler } from "../../common/middleware/asyncHandler";
import { authenticate } from "../../common/middleware/auth";
import {
    connectCallbackController,
    connectController,
    connectionStatusController,
    disconnectController,
} from "./calendar-connection.controller";

export const calendarConnectionRouter: Router = Router();

calendarConnectionRouter.get(
    "/status",
    authenticate(),
    asyncHandler(connectionStatusController)
);
calendarConnectionRouter.get("/connect", authenticate(), asyncHandler(connectController));
calendarConnectionRouter.get(
    "/connect/callback",
    asyncHandler(connectCallbackController)
);
calendarConnectionRouter.post("/disconnect", authenticate(), asyncHandler(disconnectController));
