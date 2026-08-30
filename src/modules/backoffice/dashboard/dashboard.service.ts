import {
    getCalendarConnectionAggregates,
    getChatAggregates,
    getProviderCounts,
    getUserAggregates,
} from "./dashboard.repository";

export type UsersDashboardData = {
    countByRole: Record<string, number>;
    emailUsers: number;
    googleUsers: number;
    totalApiRequestsUsed: number;
    totalApiRequestLimit: number;
    usageRatio: number;
    countByProvider: Record<string, number>;
    totalChatConversations: number;
    totalChatMessages: number;
    chatMessagesByRole: Record<string, number>;
    googleCalendarConnected: number;
    googleCalendarNotConnected: number;
};

export type DashboardQuery = {
    dateFrom?: Date;
    dateTo?: Date;
};

export async function getUsersDashboardService(
    query: DashboardQuery = {},
): Promise<UsersDashboardData> {
    const { dateFrom, dateTo } = query;

    const [aggregates, chat, providerCounts, calendar] = await Promise.all([
        getUserAggregates(dateFrom, dateTo),
        getChatAggregates(dateFrom, dateTo),
        getProviderCounts(),
        getCalendarConnectionAggregates(dateFrom, dateTo),
    ]);

    const totalUsers = Object.values(aggregates.countByRole).reduce(
        (sum, count) => sum + count,
        0,
    );

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
        countByProvider: providerCounts,
        totalChatConversations: chat.totalConversations,
        totalChatMessages: chat.totalMessages,
        chatMessagesByRole: chat.messagesByRole,
        googleCalendarConnected: calendar.connected,
        googleCalendarNotConnected: Math.max(totalUsers - calendar.connected, 0),
    };
}
