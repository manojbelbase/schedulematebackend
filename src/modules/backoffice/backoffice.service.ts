import { listUsers } from "../users/user.repository";
import { buildPagination } from "../../common/utils/pagination";
import type { ListQueryOptions } from "../../common/utils/pagination";

export async function listUsersService(query: ListQueryOptions) {
    const { items, total } = await listUsers(query);
    const pagination = buildPagination(total, query.page, query.take, items.length);
    return { items, pagination };
}