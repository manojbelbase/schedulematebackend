import { AppDataSource } from "../config/data-source";
import { createUser } from "../modules/users/user.repository";
import { hashPassword } from "../common/utils/password";
import { UserRole } from "../modules/users/user.entity";
import { env } from "../config/env";

async function seedBackoffice() {
    const email = env.backofficeEmail;
    const password = env.backofficePassword;
    const name = env.backofficeName;

    if (!email || !password) {
        console.error("Missing BACKOFFICE_EMAIL or BACKOFFICE_PASSWORD env vars");
        process.exit(1);
    }

    if (password.length < 16) {
        console.error("Password too short (min 16 chars for production)");
        process.exit(1);
    }

    await AppDataSource.initialize();
    console.log("Database connected");

    const existing = await AppDataSource.getRepository("User").findOne({ where: { email } });
    if (existing) {
        console.log("Backoffice user already exists");
        await AppDataSource.destroy();
        return;
    }

    const passwordHash = await hashPassword(password);
    await createUser({
        email,
        name,
        passwordHash,
        role: UserRole.ADMIN,
    });

    console.log("Backoffice user created:", email);
    await AppDataSource.destroy();
}

seedBackoffice().catch(console.error);