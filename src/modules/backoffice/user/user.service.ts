import { AppError } from "../../../common/errors/AppError";
import { httpStatus } from "../../../constants/httpStatus";
import { listUsers, createUser, findByEmail, deleteUser, findUserById, updateUserLimit } from "../../users/user.repository";
import { deleteUserChatData } from "../../chat/chat.repository";
import { deletePasswordResetsForUser } from "../../passwordReset/passwordReset.repository";
import { buildPagination } from "../../../common/utils/pagination";
import type { ListQueryOptions } from "../../../common/utils/pagination";
import type { UserRole } from "../../users/user.entity";
import type { User } from "../../users/user.entity";

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
    await Promise.all([
        deleteUserChatData(id),
        deletePasswordResetsForUser(id),
    ]);
}

export async function updateUserLimitService(
    id: string,
    data: { apiRequestLimit?: number; resetUsed?: boolean }
): Promise<User> {
    const user = await updateUserLimit(id, data);
    if (!user) {
        throw new AppError("User not found", httpStatus.NOT_FOUND);
    }
    return user;
}