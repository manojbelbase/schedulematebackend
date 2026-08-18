import { z } from "zod";

export const resetPasswordSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
    newPassword: z.string().min(8).max(128),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
