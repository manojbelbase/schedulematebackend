import type { Request, Response } from "express";
import { httpStatus } from "../../constants/httpStatus";
import { sendSuccess } from "../../lib/response";
import { getUsersDashboardService } from "./dashboard.service";

export async function usersDashboardController(_req: Request, res: Response): Promise<void> {
    const data = await getUsersDashboardService();
    sendSuccess(res, httpStatus.OK, "Users dashboard fetched successfully", data);
}
