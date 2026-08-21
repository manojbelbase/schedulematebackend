import { AppDataSource } from "../../config/data-source";
import { CalendarConnection } from "./calendarConnection.entity";

const calendarConnectionRepository = AppDataSource.getRepository(CalendarConnection);

export async function findByUserId(userId: string): Promise<CalendarConnection | null> {
    return await calendarConnectionRepository.findOne({
        where: { userId },
    });
}

export async function createConnection(data: {
    userId: string;
    googleEmail: string | null;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date | null;
    connected?: boolean;
}): Promise<CalendarConnection> {
    const connection = calendarConnectionRepository.create(data);
    return await calendarConnectionRepository.save(connection);
}

export async function updateConnection(
    userId: string,
    data: {
        googleEmail?: string | null;
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: Date | null;
        connected?: boolean;
    }
): Promise<CalendarConnection | null> {
    const connection = await findByUserId(userId);
    if (!connection) {
        return null;
    }
    if (data.googleEmail !== undefined) {
        connection.googleEmail = data.googleEmail;
    }
    if (data.accessToken !== undefined) {
        connection.accessToken = data.accessToken;
    }
    if (data.refreshToken !== undefined) {
        connection.refreshToken = data.refreshToken;
    }
    if (data.expiresAt !== undefined) {
        connection.expiresAt = data.expiresAt;
    }
    if (data.connected !== undefined) {
        connection.connected = data.connected;
    }
    return await calendarConnectionRepository.save(connection);
}

export async function saveConnection(
    userId: string,
    data: {
        googleEmail: string | null;
        accessToken: string;
        refreshToken: string;
        expiresAt: Date | null;
        connected?: boolean;
    }
): Promise<CalendarConnection> {
    const existing = await findByUserId(userId);
    if (existing) {
        existing.googleEmail = data.googleEmail;
        existing.accessToken = data.accessToken;
        existing.refreshToken = data.refreshToken;
        existing.expiresAt = data.expiresAt;
        if (data.connected !== undefined) {
            existing.connected = data.connected;
        }
        return await calendarConnectionRepository.save(existing);
    }
    return await createConnection({ userId, ...data });
}
