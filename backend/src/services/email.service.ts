import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_TIMEOUT_MS = 12000;

const hasBrevoApi = Boolean(env.brevo.apiKey);
const hasSmtp = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

const transporter =
  !hasBrevoApi && hasSmtp
    ? nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.port === 465,
        auth: {
          user: env.smtp.user,
          pass: env.smtp.pass,
        },
      })
    : null;

function parseAddress(value: string): { name?: string; email: string } {
  const match = value.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (match) {
    const name = match[1].trim();
    return { email: match[2].trim(), ...(name ? { name } : {}) };
  }
  return { email: value.trim() };
}

async function sendViaBrevoApi(
  to: string,
  subject: string,
  html: string,
  replyTo?: string
): Promise<boolean> {
  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": env.brevo.apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: parseAddress(env.smtp.from),
        to: [{ email: to }],
        subject,
        htmlContent: html,
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
      }),
      signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      logger.error("Brevo API rejected email", {
        to,
        subject,
        status: response.status,
        detail: detail.slice(0, 300),
      });
      return false;
    }
    return true;
  } catch (error) {
    logger.error("Failed to send email via Brevo API", {
      to,
      subject,
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}

export const emailService = {
  isConfigured: hasBrevoApi || hasSmtp,

  /** Returns true only when the message was accepted by Brevo (API) or the SMTP server. */
  async sendMail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
    if (hasBrevoApi) {
      return sendViaBrevoApi(to, subject, html, replyTo);
    }

    if (!transporter) {
      logger.info("Email skipped because Brevo API and SMTP are not configured", { to, subject });
      return false;
    }

    try {
      await transporter.sendMail({
        from: env.smtp.from,
        to,
        subject,
        html,
        replyTo,
      });
      return true;
    } catch (error) {
      logger.error("Failed to send email", {
        to,
        subject,
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  },

  async sendPasswordReset(to: string, resetUrl: string) {
    return this.sendMail(
      to,
      "Reset your Habbiters password",
      `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 15 minutes.</p>`
    );
  },

  async sendSignupOtp(to: string, otp: string) {
    return this.sendMail(
      to,
      "Verify your Habbiters account",
      `<p>Your Habbiters verification code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`
    );
  },

  async sendLoginOtp(to: string, otp: string) {
    return this.sendMail(
      to,
      "Your Habbiters login code",
      `<p>Your Habbiters login code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes. If you did not request it, ignore this email.</p>`
    );
  },

  async sendPaymentClaimReceived(to: string, reference: string, planLabel: string) {
    return this.sendMail(
      to,
      "We received your Habbiters payment details",
      `<p>Thanks! We received your payment reference <strong>${escapeHtml(reference)}</strong> for <strong>${escapeHtml(planLabel)}</strong>.</p><p>An admin will verify it and activate your plan, usually within one business day.</p>`
    );
  },

  async sendPremiumActivated(to: string, planLabel: string, until?: Date | null) {
    return this.sendMail(
      to,
      "Habbiters Premium is active",
      `<p>Your <strong>${escapeHtml(planLabel)}</strong> access is now active${until ? ` until ${until.toDateString()}` : ""}.</p><p>Open the Templates page to explore every premium template.</p>`
    );
  },

  async sendPaymentClaimRejected(to: string, reference: string, reason?: string) {
    return this.sendMail(
      to,
      "Habbiters payment verification issue",
      `<p>We could not verify the payment reference <strong>${escapeHtml(reference)}</strong>.</p>${reason ? `<p>Reason: ${escapeHtml(reason)}</p>` : ""}<p>Reply to this email with your Razorpay payment ID or UTR and we will take another look.</p>`
    );
  },

  async sendReminder(to: string, title: string, message: string) {
    return this.sendMail(to, title, `<p>${escapeHtml(message)}</p>`);
  },
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
