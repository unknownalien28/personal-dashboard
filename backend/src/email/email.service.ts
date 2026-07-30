import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Minimal email-sending abstraction. When SMTP_HOST is unset (the default
 * for local dev), messages are logged instead of sent — this keeps the
 * register/forgot-password flows fully functional without real SMTP
 * credentials. Swap the body of `send` for nodemailer/SES/Postmark/etc.
 * later without touching any caller.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async send(message: EmailMessage): Promise<void> {
    const smtpHost = this.config.get<string>("email.smtpHost");
    if (!smtpHost) {
      this.logger.log(`[dev email] To: ${message.to} | Subject: ${message.subject}\n${message.text}`);
      return;
    }

    // Real SMTP wiring goes here (e.g. nodemailer.createTransport(...)) once
    // SMTP_HOST/SMTP_USER/SMTP_PASSWORD are provided in the environment.
    this.logger.warn("SMTP is configured but no transport is implemented yet — falling back to console log.");
    this.logger.log(`[dev email] To: ${message.to} | Subject: ${message.subject}\n${message.text}`);
  }

  sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    return this.send({
      to,
      subject: "Verify your AlienOS email",
      text: `Welcome to AlienOS! Confirm your email by visiting:\n${verifyUrl}\n\nThis link expires soon — if it's stale, request a new one from the app.`,
    });
  }

  sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    return this.send({
      to,
      subject: "Reset your AlienOS password",
      text: `We received a request to reset your AlienOS password. Visit:\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    });
  }
}
