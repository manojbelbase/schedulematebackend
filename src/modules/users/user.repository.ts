import { AppDataSource } from "../../config/data-source";
import { User, UserRole } from "./user.entity";
import type { ListQueryOptions } from "../../common/utils/pagination";

const userRepository = AppDataSource.getRepository(User);

const ALLOWED_SORT_COLUMNS = ["email", "name", "username", "role", "createdAt", "updatedAt"];

export async function findByEmail(email: string): Promise<User | null> {
    return await userRepository.findOne({
        where: { email },
    });
}

export async function findByUsername(username: string): Promise<User | null> {
    return await userRepository.findOne({
        where: { username },
    });
}

export async function findUserById(id: string): Promise<User | null> {
    return await userRepository.findOne({
        where: { id },
    });
}

export async function findByGoogleId(googleId: string): Promise<User | null> {
    return await userRepository.findOne({
        where: { googleId },
    });
}

export async function createUser(data: {
    email: string;
    name?: string | null;
    username?: string | null;
    passwordHash?: string | null;
    googleId?: string | null;
    role?: UserRole;
}): Promise<User> {
    const user = userRepository.create({
        email: data.email,
        name: data.name ?? null,
        username: data.username ?? null,
        password: data.passwordHash ?? null,
        googleId: data.googleId ?? null,
        role: data.role ?? UserRole.USER,
    });
    return await userRepository.save(user);
}

export async function updateUser(
    id: string,
    data: {
        name?: string | null;
        email?: string;
        username?: string | null;
        passwordHash?: string | null;
        googleId?: string | null;
        role?: UserRole;
    }
): Promise<User | null> {
    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
        return null;
    }
    if (data.name !== undefined) {
        user.name = data.name;
    }
    if (data.email !== undefined) {
        user.email = data.email;
    }
    if (data.username !== undefined) {
        user.username = data.username;
    }
    if (data.passwordHash !== undefined) {
        user.password = data.passwordHash;
    }
    if (data.googleId !== undefined) {
        user.googleId = data.googleId;
    }
    if (data.role !== undefined) {
        user.role = data.role;
    }
    return await userRepository.save(user);
}

export async function incrementRequestCount(id: string): Promise<void> {
    await userRepository.increment({ id }, "apiRequestsUsed", 1);
}

export async function updateUserLimit(
    id: string,
    data: { apiRequestLimit?: number; resetUsed?: boolean }
): Promise<User | null> {
    const user = await userRepository.findOne({ where: { id } });
    if (!user) return null;
    if (data.apiRequestLimit !== undefined) {
        user.apiRequestLimit = data.apiRequestLimit;
    }
    if (data.resetUsed) {
        user.apiRequestsUsed = 0;
    }
    return await userRepository.save(user);
}

export async function deleteUser(id: string): Promise<boolean> {
    const result = await userRepository.delete({ id });
    return (result.affected ?? 0) > 0;
}

export async function listUsers(query: ListQueryOptions, role?: UserRole): Promise<{ items: User[]; total: number }> {
    const qb = userRepository.createQueryBuilder("user");

    if (query.query) {
        qb.andWhere(
            "(user.email ILIKE :query OR user.name ILIKE :query OR user.username ILIKE :query)",
            { query: `%${query.query}%` }
        );
    }

    if (query.dateFrom) {
        qb.andWhere("user.createdAt >= :dateFrom", { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
        qb.andWhere("user.createdAt <= :dateTo", { dateTo: query.dateTo });
    }

    if (role) {
        qb.andWhere("user.role = :role", { role });
    }

    const total = await qb.getCount();

    const sortBy = ALLOWED_SORT_COLUMNS.includes(query.sortBy) ? query.sortBy : "createdAt";
    qb.orderBy(`user.${sortBy}`, query.sortOrder);
    qb.skip(query.page * query.take).take(query.take);

    const items = await qb.getMany();

    return { items, total };
}