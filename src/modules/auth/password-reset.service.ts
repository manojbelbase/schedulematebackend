import { randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { AppError } from "../../common/errors/AppError";
import { httpStatus } from "../../constants/httpStatus";
import { env } from "../../config/env";
import { hashPassword } from "../../common/utils/password";
import { sendOtpEmail } from "../../common/utils/mailer";
import { findByEmail, updateUser } from "../users/user.repository";
import {
    createPasswordReset,
    findPendingResetByUser,
    invalidateActiveOtpsForUser,
    markResetUsed,
} from "../password-reset/password-reset.repository";
import type { User } from "../users/user.entity";

function generateOtp(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function hashOtp(otp: string): string {
    const salt = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const hash = scryptSync(otp, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

function otpMatches(otp: string, stored: string): boolean {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) {
        return false;
    }
    const candidate = scryptSync(otp, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function requestPasswordReset(email: string): Promise<void> {
    const user = await findByEmail(email);
    if (!user) {
        return;
    }

    const otp = generateOtp();
    const ttlMinutes = env.otpTtlMinutes;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    await invalidateActiveOtpsForUser(user.id);
    await createPasswordReset({
        userId: user.id,
        hashedOtp: hashOtp(otp),
        expiresAt,
    });

    await sendOtpEmail(user.email, otp, ttlMinutes);
}

export async function verifyOtp(email: string, otp: string): Promise<void> {
    const reset = await findValidReset(email, otp);
    if (!reset) {
        throw new AppError("Invalid or expired OTP", httpStatus.BAD_REQUEST);
    }
}

export async function resetPasswordWithOtp(
    email: string,
    otp: string,
    newPassword: string
): Promise<User> {
    const reset = await findValidReset(email, otp);
    if (!reset) {
        throw new AppError("Invalid or expired OTP", httpStatus.BAD_REQUEST);
    }

    const passwordHash = hashPassword(newPassword);
    const user = await updateUser(reset.userId, { passwordHash });
    if (!user) {
        throw new AppError("User no longer exists", httpStatus.NOT_FOUND);
    }

    await markResetUsed(reset.id);

    return user;
}

async function findValidReset(
    email: string,
    otp: string
): Promise<{ id: string; userId: string } | null> {
    const user = await findByEmail(email);
    if (!user) {
        return null;
    }

    const reset = await findPendingResetByUser(user.id);
    if (!reset) {
        return null;
    }

    if (reset.expiresAt.getTime() < Date.now()) {
        await markResetUsed(reset.id);
        return null;
    }

    if (!otpMatches(otp, reset.hashedOtp)) {
        return null;
    }

    return { id: reset.id, userId: reset.userId };
}
