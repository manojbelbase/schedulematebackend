import { AppDataSource } from "../../config/data-source";
import { PasswordReset } from "./passwordReset.entity";

const passwordResetRepository = AppDataSource.getRepository(PasswordReset);

export async function invalidateActiveOtpsForUser(userId: string): Promise<void> {
    await passwordResetRepository.update(
        { userId, used: false },
        { used: true }
    );
}

export async function createPasswordReset(data: {
    userId: string;
    hashedOtp: string;
    expiresAt: Date;
}): Promise<PasswordReset> {
    const record = passwordResetRepository.create({
        userId: data.userId,
        hashedOtp: data.hashedOtp,
        expiresAt: data.expiresAt,
        used: false,
    });
    return await passwordResetRepository.save(record);
}

export async function findPendingResetByUser(
    userId: string
): Promise<PasswordReset | null> {
    return await passwordResetRepository.findOne({
        where: { userId, used: false },
        order: { createdAt: "DESC" },
    });
}

export async function markResetUsed(id: string): Promise<void> {
    await passwordResetRepository.update({ id }, { used: true });
}

export async function deletePasswordResetsForUser(userId: string): Promise<void> {
    await passwordResetRepository.delete({ userId });
}
