import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly config: ConfigService) {}

  async sendMessage(text: string): Promise<boolean> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN')?.trim();
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID')?.trim();

    if (!token || !chatId) {
      this.logger.warn('Telegram credentials are not configured.');
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`Telegram send failed (${response.status}): ${body}`);
        return false;
      }

      const result = (await response.json()) as { ok?: boolean };
      if (!result.ok) {
        this.logger.error('Telegram API returned ok=false.');
        return false;
      }

      this.logger.log('Telegram notification sent successfully.');
      return true;
    } catch (error) {
      this.logger.error(
        `Telegram notification error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
