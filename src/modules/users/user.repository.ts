import { AppDataSource } from "../../config/data-source";
import { User } from "./user.entity";

const userRepository = AppDataSource.getRepository(User);

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
}): Promise<User> {
    const user = userRepository.create({
        email: data.email,
        name: data.name ?? null,
        username: data.username ?? null,
        password: data.passwordHash ?? null,
        googleId: data.googleId ?? null,
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
    return await userRepository.save(user);
}

export async function deleteUser(id: string): Promise<boolean> {
    const result = await userRepository.delete({ id });
    return (result.affected ?? 0) > 0;
}