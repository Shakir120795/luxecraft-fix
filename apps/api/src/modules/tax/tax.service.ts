import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaxService {
  private readonly logger = new Logger(TaxService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateTax(params: {
    country: string;
    stateProvince?: string;
    amount: number;
  }): Promise<{ taxAmount: number; taxRate: number; isInclusive: boolean }> {
    const rule = await this.prisma.taxRule.findFirst({
      where: {
        country: params.country,
        stateProvince: params.stateProvince ?? null,
        isActive: true,
      },
    });

    if (!rule) {
      return { taxAmount: 0, taxRate: 0, isInclusive: false };
    }

    const taxRate = Number(rule.taxRate);
    const isInclusive = rule.isInclusive;

    let taxAmount: number;
    if (isInclusive) {
      // Tax already included in price — extract it
      taxAmount = params.amount - params.amount / (1 + taxRate / 100);
    } else {
      // Tax exclusive — add it
      taxAmount = params.amount * (taxRate / 100);
    }

    return { taxAmount, taxRate, isInclusive };
  }
}
