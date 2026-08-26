import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { listUsers, createUser, findByEmail, deleteUser } from "../users/user.repository";
import { buildPagination } from "../../common/utils/pagination";
import type { ListQueryOptions } from "../../common/utils/pagination";
import type { UserRole } from "../users/user.entity";
import type { User } from "../users/user.entity";

export async function listUsersService(query: ListQueryOptions, role?: UserRole) {
    const { items, total } = await listUsers(query, role);
    const pagination = buildPagination(total, query.page, query.take, items.length);
    return { items, pagination };
}

export async function addUserService(email: string, name?: string): Promise<User> {
    const existing = await findByEmail(email);
    if (existing) {
        throw new AppError("A user with this email already exists", httpStatus.CONFLICT);
    }

    return await createUser({ email, name: name ?? null });
}

export async function deleteUserService(id: string): Promise<void> {
    const deleted = await deleteUser(id);
    if (!deleted) {
        throw new AppError("User not found", httpStatus.NOT_FOUND);
    }
}