import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../common/utils/jwt";
import { hashPassword, verifyPassword } from "../../common/utils/password";
import {
    createUser,
    findByEmail,
    findByGoogleId,
    findUserById,
    updateUser,
} from "../users/user.repository";
import type { User } from "../users/user.entity";
import type { TokenPayload } from "google-auth-library";

export function toPublicUser(user: User): {
    id: string;
    name: string | null;
    email: string;
    username: string | null;
} {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
    };
}

export async function findOrCreateGoogleUser(payload: TokenPayload): Promise<User> {
    const googleId = payload.sub;
    const email = payload.email ?? "";
    const name = payload.name ?? undefined;

    const byGoogleId = await findByGoogleId(googleId);
    if (byGoogleId) {
        if (name && name !== byGoogleId.name) {
            return (await updateUser(byGoogleId.id, { name })) ?? byGoogleId;
        }
        return byGoogleId;
    }

    const byEmail = email ? await findByEmail(email) : null;
    if (byEmail) {
        if (byEmail.googleId) {
            return byEmail;
        }
        return (await updateUser(byEmail.id, { googleId, name: name ?? byEmail.name })) ?? byEmail;
    }

    return await createUser({
        email,
        name: name ?? null,
        googleId,
    });
}

export async function loginByGoogle(payload: TokenPayload): Promise<{
    accessToken: string;
    refreshToken: string;
    user: User;
}> {
    const user = await findOrCreateGoogleUser(payload);
    const tokenPayload = { sub: user.id, email: user.email };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);
    return { accessToken, refreshToken, user };
}

export async function refreshUserSession(
    refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch {
        throw new AppError("Invalid or expired refresh token", httpStatus.UNAUTHORIZED);
    }

    const user = await findUserById(decoded.sub);
    if (!user) {
        throw new AppError("User no longer exists", httpStatus.UNAUTHORIZED);
    }

    const tokenPayload = { sub: user.id, email: user.email };
    const accessToken = signAccessToken(tokenPayload);
    const nextRefreshToken = signRefreshToken(tokenPayload);

    return { accessToken, refreshToken: nextRefreshToken, user };
}

export async function registerWithEmail(
    email: string,
    name: string | undefined,
    password: string
): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const existing = await findByEmail(email);
    if (existing) {
        throw new AppError("User with this email already exists", httpStatus.CONFLICT);
    }

    const passwordHash = hashPassword(password);
    const user = await createUser({ email, name: name ?? null, passwordHash });

    const tokenPayload = { sub: user.id, email: user.email };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return { accessToken, refreshToken, user };
}

export async function loginWithEmail(
    email: string,
    password: string
): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const user = await findByEmail(email);
    if (!user || !user.password || !verifyPassword(password, user.password)) {
        throw new AppError("Invalid email or password", httpStatus.UNAUTHORIZED);
    }

    const tokenPayload = { sub: user.id, email: user.email };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return { accessToken, refreshToken, user };
}
