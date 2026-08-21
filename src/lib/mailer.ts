import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "./logger";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
    if (!env.smtpUser || !env.smtpPass) {
        return null;
    }
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: env.smtpHost,
            port: env.smtpPort,
            secure: env.smtpSecure,
            auth: {
                user: env.smtpUser,
                pass: env.smtpPass,
            },
        });
    }
    return transporter;
}

export async function sendOtpEmail(to: string, otp: string, ttlMinutes: number): Promise<void> {
    const t = getTransporter();
    if (!t) {
        logger.warn("SMTP not configured; OTP email not sent. OTP for %s: %s", to, otp);
        return;
    }

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2>ScheduledMate Password Reset</h2>
      <p>We received a request to reset the password for <strong>${escapeHtml(to)}</strong>.</p>
      <p>Your one-time verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; margin: 24px 0; padding: 16px; background: #f3f4f6; border-radius: 8px;">
        ${escapeHtml(otp)}
      </div>
      <p>This code expires in <strong>${ttlMinutes} minutes</strong>. If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

    await t.sendMail({
        from: env.smtpFrom || env.smtpUser,
        to,
        subject: "ScheduledMate Password Reset Code",
        html,
    });
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
