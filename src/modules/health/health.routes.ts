import { Router } from "express";
import { sendSuccess } from "../../lib/response";
import { httpStatus } from "../../constants/httpStatus";

export const healthRouter: Router = Router();

healthRouter.get("/", async (_req, res) => {
    sendSuccess(res, httpStatus.OK, "Server is healthy", {
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});