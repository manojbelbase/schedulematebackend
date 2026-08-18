import type { Response } from "express";
import type { Pagination } from "../common/utils/pagination";

export type ApiResponse<T> = {
    success: boolean;
    message: string;
    data?: T;
    pagination?: Pagination;
};

export function sendSuccess<T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T,
    pagination?: Pagination
): void {
    const body: ApiResponse<T> = { success: true, message };
    if (data !== undefined) {
        body.data = data;
    }
    if (pagination !== undefined) {
        body.pagination = pagination;
    }
    res.status(statusCode).json(body);
}