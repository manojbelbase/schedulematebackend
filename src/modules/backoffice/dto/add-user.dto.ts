import { z } from "zod";

export const addUserSchema = z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().max(100).optional(),
});

export type AddUserDto = z.infer<typeof addUserSchema>;
