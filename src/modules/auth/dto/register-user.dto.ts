import { z } from "zod";

export const registerUserSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1).max(100).optional(),
    password: z.string().min(8).max(128),
});

export type RegisterUserDto = z.infer<typeof registerUserSchema>;
