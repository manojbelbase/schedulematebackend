import { AppDataSource } from "../../config/data-source";
import type { ListQueryOptions } from "../../common/utils/pagination";
import { AccessRequest, AccessRequestStatus } from "./accessRequest.entity";

const accessRequestRepository = AppDataSource.getRepository(AccessRequest);

export async function createAccessRequest(data: {
    userId: string;
    requesterEmail: string;
    requesterName: string | null;
    message?: string | null;
}): Promise<AccessRequest> {
    const request = accessRequestRepository.create({
        userId: data.userId,
        requesterEmail: data.requesterEmail,
        requesterName: data.requesterName,
        message: data.message ?? null,
        status: AccessRequestStatus.PENDING,
    });
    return await accessRequestRepository.save(request);
}

export async function listAccessRequests(query: ListQueryOptions): Promise<{
    items: AccessRequest[];
    total: number;
}> {
    const qb = accessRequestRepository.createQueryBuilder("request").leftJoinAndSelect(
        "request.user",
        "user"
    );

    if (query.query) {
        qb.andWhere(
            "(request.requesterEmail ILIKE :query OR request.requesterName ILIKE :query OR user.email ILIKE :query)",
            { query: `%${query.query}%` }
        );
    }

    if (query.dateFrom) {
        qb.andWhere("request.createdAt >= :dateFrom", { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
        qb.andWhere("request.createdAt <= :dateTo", { dateTo: query.dateTo });
    }

    const total = await qb.getCount();

    qb.orderBy(`request.${query.sortBy === "requesterEmail" ? "requesterEmail" : "createdAt"}`, query.sortOrder).skip(
        query.page * query.take
    ).take(query.take);

    const items = await qb.getMany();

    return { items, total };
}

export async function findAccessRequestById(id: string): Promise<AccessRequest | null> {
    return await accessRequestRepository.findOne({ where: { id } });
}

export async function updateAccessRequestStatus(
    id: string,
    status: AccessRequestStatus
): Promise<AccessRequest | null> {
    const request = await findAccessRequestById(id);
    if (!request) {
        return null;
    }
    request.status = status;
    return await accessRequestRepository.save(request);
}
