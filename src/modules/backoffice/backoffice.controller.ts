import type { Request, Response } from "express";
import { httpStatus } from "../../constants/httpStatus";
import { sendSuccess } from "../../lib/response";
import { parseListQuery } from "../../common/utils/pagination";
import { listUsersService } from "./backoffice.service";

export async function listUsersController(req: Request, res: Response) {
    const query = parseListQuery(req.query);
    const result = await listUsersService(query);

    const publicUsers = result.items.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
    }));

    sendSuccess(res, httpStatus.OK, "Users fetched successfully", publicUsers, result.pagination);
}