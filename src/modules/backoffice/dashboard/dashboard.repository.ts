import { Between, IsNull } from "typeorm";
import type { FindOptionsWhere } from "typeorm";
import { AppDataSource } from "../../../config/data-source";
import { User } from "../../users/user.entity";
import { ChatConversation } from "../../chat/chat-conversation.entity";
import { ChatMessage } from "../../chat/chat-message.entity";
import { LlmConfig } from "../llmConfig/llmConfig.entity";
import { CalendarConnection } from "../../calendarConnection/calendarConnection.entity";

const userRepository = AppDataSource.getRepository(User);
const chatConversationRepository = AppDataSource.getRepository(ChatConversation);
const chatMessageRepository = AppDataSource.getRepository(ChatMessage);
const llmConfigRepository = AppDataSource.getRepository(LlmConfig);
const calendarConnectionRepository = AppDataSource.getRepository(CalendarConnection);

export type RoleCount = Record<string, number>;

export type UserAggregates = {
    countByRole: RoleCount;
    emailUsers: number;
    googleUsers: number;
    totalApiRequestsUsed: number;
    totalApiRequestLimit: number;
};

export type ChatAggregates = {
    totalConversations: number;
    totalMessages: number;
    messagesByRole: Record<string, number>;
};

function toRange(
    dateFrom?: Date,
    dateTo?: Date,
): { from: Date; to: Date } | undefined {
    if (dateFrom === undefined && dateTo === undefined) return undefined;
    return {
        from: dateFrom ?? new Date(0),
        to: dateTo ?? new Date(),
    };
}

export async function getUserAggregates(
    dateFrom?: Date,
    dateTo?: Date,
): Promise<UserAggregates> {
    const range = toRange(dateFrom, dateTo);

    const qb = userRepository
        .createQueryBuilder("user")
        .select("user.role", "role")
        .addSelect("COUNT(user.id)", "count")
        .addSelect("SUM(user.apiRequestLimit)", "totalApiRequestLimit")
        .addSelect("SUM(user.apiRequestsUsed)", "totalApiRequestsUsed")
        .groupBy("user.role");

    if (range !== undefined) {
        qb.where("user.createdAt BETWEEN :dateFrom AND :dateTo", {
            dateFrom: range.from,
            dateTo: range.to,
        });
    }

    const raw = (await qb.getRawMany()) as {
        role: string;
        count: string;
        totalApiRequestLimit: string | null;
        totalApiRequestsUsed: string | null;
    }[];

    const countByRole: RoleCount = {};
    let totalApiRequestLimit = 0;
    let totalApiRequestsUsed = 0;

    for (const row of raw) {
        countByRole[row.role] = Number(row.count);
        totalApiRequestLimit += Number(row.totalApiRequestLimit ?? 0);
        totalApiRequestsUsed += Number(row.totalApiRequestsUsed ?? 0);
    }

    const googleWhere: FindOptionsWhere<User> = { googleId: IsNull() };
    if (range !== undefined) {
        googleWhere.createdAt = Between(range.from, range.to);
    }

    const emailUsers = await userRepository.count({ where: googleWhere });
    const totalUsers = Object.values(countByRole).reduce((sum, count) => sum + count, 0);

    return {
        countByRole,
        emailUsers,
        googleUsers: totalUsers - emailUsers,
        totalApiRequestsUsed,
        totalApiRequestLimit,
    };
}

export async function getChatAggregates(
    dateFrom?: Date,
    dateTo?: Date,
): Promise<ChatAggregates> {
    const range = toRange(dateFrom, dateTo);

    const conversationWhere: FindOptionsWhere<ChatConversation> = {};
    const messageWhere: FindOptionsWhere<ChatMessage> = {};
    if (range !== undefined) {
        conversationWhere.createdAt = Between(range.from, range.to);
        messageWhere.createdAt = Between(range.from, range.to);
    }

    let roleQuery = chatMessageRepository
        .createQueryBuilder("message")
        .select("message.role", "role")
        .addSelect("COUNT(message.id)", "count")
        .groupBy("message.role");

    if (range !== undefined) {
        roleQuery = roleQuery.where(
            "message.createdAt BETWEEN :dateFrom AND :dateTo",
            { dateFrom: range.from, dateTo: range.to },
        );
    }

    const [totalConversations, totalMessages, roleRows] = await Promise.all([
        chatConversationRepository.count({ where: conversationWhere }),
        chatMessageRepository.count({ where: messageWhere }),
        roleQuery.getRawMany(),
    ]);

    const messagesByRole: Record<string, number> = {};
    for (const row of roleRows as { role: string; count: string }[]) {
        messagesByRole[row.role] = Number(row.count);
    }

    return {
        totalConversations,
        totalMessages,
        messagesByRole,
    };
}

export async function getProviderCounts(): Promise<Record<string, number>> {
    const rows = (await llmConfigRepository
        .createQueryBuilder("config")
        .select("config.activeProvider", "provider")
        .addSelect("COUNT(config.id)", "count")
        .groupBy("config.activeProvider")
        .getRawMany()) as { provider: string; count: string }[];

    const counts: Record<string, number> = {};
    for (const row of rows) {
        counts[row.provider] = Number(row.count);
    }
    return counts;
}

export async function getCalendarConnectionAggregates(
    dateFrom?: Date,
    dateTo?: Date,
): Promise<{ connected: number }> {
    const range = toRange(dateFrom, dateTo);

    const qb = calendarConnectionRepository
        .createQueryBuilder("connection")
        .select("COUNT(DISTINCT connection.user_id)", "count")
        .where("connection.connected = :connected", { connected: true });

    if (range !== undefined) {
        qb.andWhere("connection.createdAt BETWEEN :dateFrom AND :dateTo", {
            dateFrom: range.from,
            dateTo: range.to,
        });
    }

    const row = (await qb.getRawOne()) as { count: string } | undefined;

    return { connected: Number(row?.count ?? 0) };
}