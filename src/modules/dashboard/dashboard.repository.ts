import { IsNull } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { User } from "../users/user.entity";

const userRepository = AppDataSource.getRepository(User);

export type RoleCount = Record<string, number>;

export type UserAggregates = {
    countByRole: RoleCount;
    emailUsers: number;
    googleUsers: number;
    totalApiRequestsUsed: number;
    totalApiRequestLimit: number;
};

export async function getUserAggregates(): Promise<UserAggregates> {
    const raw = (await userRepository
        .createQueryBuilder("user")
        .select("user.role", "role")
        .addSelect("COUNT(user.id)", "count")
        .addSelect("SUM(user.apiRequestLimit)", "totalApiRequestLimit")
        .addSelect("SUM(user.apiRequestsUsed)", "totalApiRequestsUsed")
        .groupBy("user.role")
        .getRawMany()) as { role: string; count: string; totalApiRequestLimit: string | null; totalApiRequestsUsed: string | null }[];

    const countByRole: RoleCount = {};
    let totalApiRequestLimit = 0;
    let totalApiRequestsUsed = 0;

    for (const row of raw) {
        countByRole[row.role] = Number(row.count);
        totalApiRequestLimit += Number(row.totalApiRequestLimit ?? 0);
        totalApiRequestsUsed += Number(row.totalApiRequestsUsed ?? 0);
    }

    const emailUsers = await userRepository.count({ where: { googleId: IsNull() } });
    const totalUsers = Object.values(countByRole).reduce((sum, count) => sum + count, 0);

    return {
        countByRole,
        emailUsers,
        googleUsers: totalUsers - emailUsers,
        totalApiRequestsUsed,
        totalApiRequestLimit,
    };
}
