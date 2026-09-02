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
      'LuxeCraft',
    );

    if (provider !== 'smtp') {
      this.logger.warn(`Email provider "${provider}" is not implemented yet.`);
      return;
    }

    const transporter = this.createTransporter();

    await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to,
      subject: 'Verify your LuxeCraft account',
      text: `Your LuxeCraft verification code is ${code}. It expires soon.`,
    });

    this.logger.log(`Verification email sent to ${to}`);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const provider = this.config.get<string>(
      'commerce.email.provider',
      'none',
    );
    const from = this.config.get<string>('commerce.email.from');
    const fromName = this.config.get<string>(
      'commerce.email.fromName',
      'LuxeCraft',
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
      subject: 'Reset your LuxeCraft password',
      text:
        `Reset your LuxeCraft password using this link:\n\n${resetUrl}\n\n` +
        'This link expires in 1 hour.',
    });

    this.logger.log(`Password reset email sent to ${to}`);
  }
}
