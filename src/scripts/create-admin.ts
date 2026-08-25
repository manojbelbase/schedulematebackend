import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { AppDataSource } from "../config/data-source";
import { createUser } from "../modules/users/user.repository";
import { hashPassword } from "../common/utils/password";
import { UserRole } from "../modules/users/user.entity";

async function ask(question: string, mask = false): Promise<string> {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    if (mask) {
        process.stdout.write(question);
        const password = await new Promise<string>((resolve) => {
            stdin.setRawMode(true);
            let input = "";
            stdin.on("data", (char) => {
                const c = char.toString();
                if (c === "\n" || c === "\r" || c === "\u0004") {
                    stdin.setRawMode(false);
                    stdin.pause();
                    resolve(input);
                } else if (c === "\u0003") {
                    process.exit(1);
                } else if (c === "\b" || c === "\u007f") {
                    input = input.slice(0, -1);
                    process.stdout.write("\b \b");
                } else {
                    input += c;
                    process.stdout.write("*");
                }
            });
        });
        console.log("");
        rl.close();
        return password;
    }
    const answer = await rl.question(question);
    rl.close();
    return answer;
}

async function createAdmin() {
    console.log("=== Create Backoffice Admin ===\n");

    const email = await ask("Email: ");
    if (!email.includes("@")) {
        console.error("Invalid email");
        process.exit(1);
    }

    const password = await ask("Password (min 16 chars): ", true);
    if (password.length < 16) {
        console.error("Password too short");
        process.exit(1);
    }

    const confirm = await ask("Confirm password: ", true);
    if (password !== confirm) {
        console.error("Passwords don't match");
        process.exit(1);
    }

    const name = await ask("Name: ") || "Backoffice Admin";

    await AppDataSource.initialize();

    const existing = await AppDataSource.getRepository("User").findOne({ where: { email } });
    if (existing) {
        console.error("User already exists");
        await AppDataSource.destroy();
        process.exit(1);
    }

    const passwordHash = await hashPassword(password);
    await createUser({ email, name, passwordHash, role: UserRole.ADMIN });

    console.log("\n✓ Admin created:", email);
    await AppDataSource.destroy();
}

createAdmin().catch(console.error);