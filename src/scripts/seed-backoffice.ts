import { AppDataSource } from "../config/data-source";
import { createUser } from "../modules/users/user.repository";
import { hashPassword } from "../common/utils/password";
import { UserRole } from "../modules/users/user.entity";

async function seedBackoffice() {
    await AppDataSource.initialize();
    console.log("Database connected");

    const email = "backoffice@schedulemate.com";
    const password = "backoffice123";
    const name = "Backoffice Admin";

    const existing = await AppDataSource.getRepository("User").findOne({ where: { email } });
    if (existing) {
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
    await AppDataSource.destroy();
}

seedBackoffice().catch(console.error);