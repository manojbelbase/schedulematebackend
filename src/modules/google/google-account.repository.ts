import { AppDataSource } from "../../config/data-source";
import { GoogleAccount } from "./google-account.entity";

const googleAccountRepository = AppDataSource.getRepository(GoogleAccount);

export async function findByUserId(userId: string): Promise<GoogleAccount | null> {
    return await googleAccountRepository.findOne({
        where: { userId },
    });
}

export async function createGoogleAccount(data: {
    userId: string;
    googleEmail: string | null;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date | null;
}): Promise<GoogleAccount> {
    const account = googleAccountRepository.create(data);
    return await googleAccountRepository.save(account);
}

export async function updateGoogleAccount(
    userId: string,
    data: {
        googleEmail?: string | null;
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: Date | null;
    }
): Promise<GoogleAccount | null> {
    const account = await findByUserId(userId);
    if (!account) {
        return null;
    }
    if (data.googleEmail !== undefined) {
        account.googleEmail = data.googleEmail;
    }
    if (data.accessToken !== undefined) {
        account.accessToken = data.accessToken;
    }
    if (data.refreshToken !== undefined) {
        account.refreshToken = data.refreshToken;
    }
    if (data.expiresAt !== undefined) {
        account.expiresAt = data.expiresAt;
    }
    return await googleAccountRepository.save(account);
}

export async function saveGoogleAccount(
    userId: string,
    data: {
        googleEmail: string | null;
        accessToken: string;
        refreshToken: string;
        expiresAt: Date | null;
    }
): Promise<GoogleAccount> {
    const existing = await findByUserId(userId);
    if (existing) {
        existing.googleEmail = data.googleEmail;
        existing.accessToken = data.accessToken;
        existing.refreshToken = data.refreshToken;
        existing.expiresAt = data.expiresAt;
        return await googleAccountRepository.save(existing);
    }
    return await createGoogleAccount({ userId, ...data });
}

export async function deleteByUserId(userId: string): Promise<boolean> {
    const result = await googleAccountRepository.delete({ userId });
    return (result.affected ?? 0) > 0;
}
