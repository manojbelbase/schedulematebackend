import type { Credentials } from "google-auth-library";
import { OAuth2Client } from "google-auth-library";
import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { env } from "../../config/env";
import {
    saveConnection,
    findByUserId,
    updateConnection,
} from "./calendar-connection.repository";

export type GoogleConnectionStatus = {
    connected: boolean;
    googleEmail: string | null;
};

export async function saveConnectionCredentials(
    userId: string,
    credentials: Credentials,
    googleEmail: string | null
): Promise<void> {
    const refreshToken = credentials.refresh_token ?? "";
    if (!credentials.access_token) {
        throw new AppError("Google did not return an access token", httpStatus.BAD_REQUEST);
    }
    await saveConnection(userId, {
        googleEmail,
        accessToken: credentials.access_token,
        refreshToken,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        connected: true,
    });
}

export async function getConnectionStatus(userId: string): Promise<GoogleConnectionStatus> {
    const account = await findByUserId(userId);
    if (!account) {
        return { connected: false, googleEmail: null };
    }
    return { connected: account.connected, googleEmail: account.googleEmail };
}

export async function getOAuthClientForUser(userId: string): Promise<OAuth2Client> {
    const account = await findByUserId(userId);
    if (!account) {
        throw new AppError("Google Calendar is not connected", httpStatus.BAD_REQUEST);
    }
    const client = new OAuth2Client(
        env.googleClientId,
        env.googleClientSecret,
        env.googleConnectRedirectUri
    );
    const credentials: Credentials = {
        access_token: account.accessToken,
        refresh_token: account.refreshToken,
        ...(account.expiresAt ? { expiry_date: account.expiresAt.getTime() } : {}),
    };
    client.setCredentials(credentials);

    const expiresInMs = account.expiresAt ? account.expiresAt.getTime() - Date.now() : 0;
    if (expiresInMs < 5 * 60 * 1000 || !account.expiresAt) {
        try {
            const { credentials } = await client.refreshAccessToken();
            client.setCredentials(credentials);
            await saveConnection(userId, {
                googleEmail: account.googleEmail,
                accessToken: credentials.access_token ?? account.accessToken,
                refreshToken: credentials.refresh_token ?? account.refreshToken,
                expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
            });
        } catch {
            throw new AppError("Google access token is invalid", httpStatus.UNAUTHORIZED);
        }
    }

    return client;
}

export async function disconnectConnection(userId: string): Promise<void> {
    await updateConnection(userId, { connected: false });
}
