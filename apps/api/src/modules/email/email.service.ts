import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  private createTransporter() {
    const host = this.config.get<string>('SMTP_HOST', 'localhost');
    const port = Number(this.config.get<string>('SMTP_PORT') ?? '1025');
    const secure =
      String(this.config.get<string>('SMTP_SECURE') ?? 'false').toLowerCase() ===
      'true';
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    });
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    const provider = this.config.get<string>(
      'commerce.email.provider',
      'none',
    );
    const from = this.config.get<string>('commerce.email.from');
    const fromName = this.config.get<string>(
      'commerce.email.fromName',
      'Wolhomes',
    );

    const subject = 'Verify your Wolhomes account';
    const html =
      '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;background:#f4f0eb;color:#28231f;">' +
      '<div style="font-size:26px;font-weight:700;margin-bottom:24px;">WOLHOMES</div>' +
      '<div style="background:#ffffff;border:1px solid #e3d8ca;padding:28px;">' +
      '<div style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#2f6b36;">Email verification</div>' +
      '<h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;margin:10px 0 18px;">Verify your email</h1>' +
      '<p style="font-size:15px;line-height:1.6;">Use the verification code below to continue creating your Wolhomes account.</p>' +
      '<div style="font-size:34px;letter-spacing:.3em;font-weight:700;text-align:center;padding:18px 12px;margin:22px 0;background:#f4f0eb;">' +
      code +
      '</div>' +
      '<p style="font-size:12px;color:#6d655e;">This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>' +
      '</div></div>';

    const text =
      'Your Wolhomes verification code is ' +
      code +
      '. It expires in 10 minutes. Enter it on the Wolhomes registration page to continue.';

    if (provider === 'smtp') {
      if (!from) {
        throw new Error('SMTP verification email requires EMAIL_FROM.');
      }

      const transporter = this.createTransporter();

      await transporter.sendMail({
        from: '"' + fromName + '" <' + from + '>',
        to,
        subject,
        text,
        html,
      });

      this.logger.log('Verification email sent via SMTP to ' + to);
      return;
    }

    if (provider === 'resend') {
      const apiKey = this.config.get<string>('commerce.email.resendApiKey');
      if (!apiKey || !from) {
        throw new Error(
          'Resend verification email requires RESEND_API_KEY and EMAIL_FROM.',
        );
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          from: '"' + fromName + '" <' + from + '>',
          to: [to],
          subject,
          text,
          html,
        }),
      });

      if (!response.ok) {
        const details = await response.text().catch(() => '');
        throw new Error(
          'Resend email failed (' + response.status + '): ' + details,
        );
      }

      this.logger.log('Verification email sent via Resend to ' + to);
      return;
    }

    throw new Error(
      'Email verification is not configured. Set EMAIL_PROVIDER to smtp or resend.',
    );
  }
  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const provider = this.config.get<string>(
      'commerce.email.provider',
      'none',
    );
    const from = this.config.get<string>('commerce.email.from');
    const fromName = this.config.get<string>(
      'commerce.email.fromName',
      'Wolhomes',
    );

    if (provider !== 'smtp') {
      this.logger.warn(`Email provider "${provider}" is not implemented yet.`);
      return;
    }

    const storefrontPort = this.config.get<string>(
      'STOREFRONT_PORT',
      '3003',
    );
    const resetUrl =
      `http://localhost:${storefrontPort}/auth/reset-password?token=` +
      encodeURIComponent(token);

    const transporter = this.createTransporter();

    await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to,
      subject: 'Reset your Wolhomes password',
      text:
        `Reset your Wolhomes password using this link:\n\n${resetUrl}\n\n` +
        'This link expires in 1 hour.',
    });

    this.logger.log(`Password reset email sent to ${to}`);
  }
}



