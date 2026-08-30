import type { Request, Response } from "express";
import { httpStatus } from "../../../constants/httpStatus";
import { sendSuccess } from "../../../lib/response";
import {
    getUsersDashboardService,
    type DashboardQuery,
} from "./dashboard.service";

function parseDate(value: unknown): Date | undefined {
    if (typeof value !== "string") return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function usersDashboardController(req: Request, res: Response): Promise<void> {
    const query: DashboardQuery = {};

    const dateFrom = parseDate(req.query.dateFrom);
    const dateTo = parseDate(req.query.dateTo);

    if (dateFrom !== undefined) query.dateFrom = dateFrom;
    if (dateTo !== undefined) query.dateTo = dateTo;

    const data = await getUsersDashboardService(query);
    sendSuccess(res, httpStatus.OK, "Users dashboard fetched successfully", data);
}