import { listUsers } from "../users/user.repository";
import { buildPagination } from "../../common/utils/pagination";
import type { ListQueryOptions } from "../../common/utils/pagination";
import type { UserRole } from "../users/user.entity";

export async function listUsersService(query: ListQueryOptions, role?: UserRole) {
    const { items, total } = await listUsers(query, role);
    const pagination = buildPagination(total, query.page, query.take, items.length);
    return { items, pagination };
}