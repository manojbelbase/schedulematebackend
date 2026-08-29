import { getUserAggregates } from "./dashboard.repository";

export type UsersDashboardData = {
    countByRole: Record<string, number>;
    emailUsers: number;
    googleUsers: number;
    totalApiRequestsUsed: number;
    totalApiRequestLimit: number;
    usageRatio: number;
};

export async function getUsersDashboardService(): Promise<UsersDashboardData> {
    const aggregates = await getUserAggregates();

    const usageRatio =
        aggregates.totalApiRequestLimit > 0
            ? aggregates.totalApiRequestsUsed / aggregates.totalApiRequestLimit
            : 0;

    return {
        countByRole: aggregates.countByRole,
        emailUsers: aggregates.emailUsers,
        googleUsers: aggregates.googleUsers,
        totalApiRequestsUsed: aggregates.totalApiRequestsUsed,
        totalApiRequestLimit: aggregates.totalApiRequestLimit,
        usageRatio: Number(usageRatio.toFixed(4)),
    };
}
