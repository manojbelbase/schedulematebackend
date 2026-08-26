import type { Request, Response } from "express";
import { httpStatus } from "../../constants/httpStatus";
import { sendSuccess } from "../../lib/response";
import { parseListQuery } from "../../common/utils/pagination";
import { listUsersService, addUserService, deleteUserService } from "./backoffice.service";
import { UserRole } from "../users/user.entity";
import type { AddUserDto } from "./dto/add-user.dto";

export async function listUsersController(req: Request, res: Response) {
    const query = parseListQuery(req.query);

    let role: UserRole | undefined;
    if (typeof req.query.role === "string" && req.query.role !== "undefined") {
        const value = req.query.role as string;
        if (value === UserRole.USER || value === UserRole.ADMIN) {
            role = value;
        }
    }

    const result = await listUsersService(query, role);

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

export async function addUserController(req: Request, res: Response) {
    const { email, name } = req.body as AddUserDto;
    const user = await addUserService(email, name);

    sendSuccess(res, httpStatus.CREATED, "User created successfully. They can set their password via forgot password flow.", {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
    });
}

export async function deleteUserController(req: Request, res: Response) {
    const { id } = req.params;
    await deleteUserService(id as string);

    sendSuccess(res, httpStatus.OK, "User deleted successfully");
}