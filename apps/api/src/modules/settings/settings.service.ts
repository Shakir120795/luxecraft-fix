import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDefaultCurrency(): Promise<string> {
    const setting = await this.prisma.appSetting.findUnique({
      where: { id: 'default' },
    });

    return setting?.defaultCurrency ?? 'USD';
  }

  async updateDefaultCurrency(currency: string): Promise<string> {
    const normalized = currency.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(normalized)) {
      throw new BadRequestException('Currency must be a valid 3-letter ISO code.');
    }

    const setting = await this.prisma.appSetting.upsert({
      where: { id: 'default' },
      update: { defaultCurrency: normalized },
      create: { id: 'default', defaultCurrency: normalized },
    });

    return setting.defaultCurrency;
  }
}
