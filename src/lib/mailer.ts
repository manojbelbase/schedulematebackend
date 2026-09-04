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
        if (!env.isProduction) {
            logger.warn("SMTP not configured; OTP email not sent. OTP for %s: %s", to, otp);
        } else {
            logger.warn("SMTP not configured; OTP email would not be sent to %s in production.", to);
        }
        return;
    }

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2>ScheduleGPT Password Reset</h2>
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
        subject: "ScheduleGPT Password Reset Code",
        html,
    });
}

export async function sendAccessRequestEmail(data: {
    to: string;
    requesterEmail: string;
    requesterName: string | null;
    message: string | null;
}): Promise<void> {
    const t = getTransporter();
    if (!t) {
        logger.warn(
            "SMTP not configured; access request email not sent. Requester: %s",
            data.requesterEmail
        );
        return;
    }

    const name = data.requesterName && data.requesterName.trim() ? data.requesterName : "A user";

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <h2>ScheduleGPT Calendar Access Request</h2>
      <p><strong>${escapeHtml(name)}</strong> is requesting access to connect their Google Calendar.</p>
      <p>Their email address is:</p>
      <div style="font-size: 20px; font-weight: bold; margin: 16px 0; padding: 12px; background: #f3f4f6; border-radius: 8px;">
        ${escapeHtml(data.requesterEmail)}
      </div>
      <p>To grant access, add this email as a <strong>Test user</strong> in Google Cloud Console
      (OAuth consent screen) or publish the app so all users can connect.</p>
      ${data.message && data.message.trim() ? `<p><strong>Message from the user:</strong><br/>${escapeHtml(data.message)}</p>` : ""}
    </div>
  `;

    await t.sendMail({
        from: env.smtpFrom || env.smtpUser,
        to: data.to,
        subject: "New Google Calendar access request",
        html,
    });
}

export async function sendAccessRequestStatusEmail(data: {
    to: string;
    requesterName: string | null;
    status: "approved" | "rejected";
}): Promise<void> {
    const t = getTransporter();
    if (!t) {
        logger.warn(
            "SMTP not configured; access request status email not sent to %s",
            data.to
        );
        return;
    }

    const name = data.requesterName && data.requesterName.trim() ? data.requesterName : "";

    let statusMessage: string;
    let subject: string;
    if (data.status === "approved") {
        statusMessage =
            "Your request to access the Google Calendar has been <strong>approved</strong>. " +
            "You can now connect your calendar from the sidebar. " +
            "If you still get an error when connecting, please reach out to our support team.";
        subject = "ScheduleGPT: Google Calendar access approved";
    } else {
        statusMessage =
            "Unfortunately, your request to access the Google Calendar was <strong>rejected</strong>. " +
            "If you believe this was a mistake, please reach out to our support team.";
        subject = "ScheduleGPT: Google Calendar access request rejected";
    }

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2>ScheduleGPT Calendar Access</h2>
      ${name ? `<p>Hello, <strong>${escapeHtml(name)}</strong>.</p>` : ""}
      <p>${statusMessage}</p>
    </div>
  `;

    await t.sendMail({
        from: env.smtpFrom || env.smtpUser,
        to: data.to,
        subject,
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