import type { Request, Response } from "express";
import { httpStatus } from "../../constants/httpStatus";
import { sendSuccess } from "../../lib/response";
import {
    requestPasswordReset,
    resetPasswordWithOtp,
    verifyOtp,
} from "./password-reset.service";
import { toPublicUser } from "./auth.service";
import type { ForgotPasswordDto } from "./dto/forgot-password.dto";
import type { VerifyOtpDto } from "./dto/verify-otp.dto";
import type { ResetPasswordDto } from "./dto/reset-password.dto";

export async function forgotPasswordController(req: Request, res: Response): Promise<void> {
    const { email } = req.body as ForgotPasswordDto;
    await requestPasswordReset(email);
    sendSuccess(
        res,
        httpStatus.OK,
        "If an account exists for this email, a reset code has been sent."
    );
}

export async function verifyOtpController(req: Request, res: Response): Promise<void> {
    const { email, otp } = req.body as VerifyOtpDto;
    await verifyOtp(email, otp);
    sendSuccess(res, httpStatus.OK, "OTP verified successfully.");
}

export async function resetPasswordController(req: Request, res: Response): Promise<void> {
    const { email, otp, newPassword } = req.body as ResetPasswordDto;
    const user = await resetPasswordWithOtp(email, otp, newPassword);
    sendSuccess(res, httpStatus.OK, "Password reset successfully", toPublicUser(user));
}
