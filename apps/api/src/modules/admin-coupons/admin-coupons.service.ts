import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminCouponsService {
  private readonly logger = new Logger(AdminCouponsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    code: string;
    discountType: string;
    discountValue: number;
    validFrom: Date;
    validTo?: Date;
    minOrderAmount?: number;
    maxUsageCount?: number;
    maxPerCustomer?: number;
    showOnHome?: boolean;
  }): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      if (data.showOnHome) {
        await tx.coupon.updateMany({
          where: { showOnHome: true },
          data: { showOnHome: false },
        });
      }

      return tx.coupon.create({
        data: {
          code: data.code.toUpperCase(),
          discountType: data.discountType,
          discountValue: data.discountValue,
          validFrom: data.validFrom,
          validTo: data.validTo,
          minOrderAmount: data.minOrderAmount,
          maxUsageCount: data.maxUsageCount,
          maxPerCustomer: data.maxPerCustomer ?? null,
          showOnHome: data.showOnHome ?? false,
        },
      });
    });
  }

  async getHomeCoupon(): Promise<any | null> {
    const now = new Date();

    const coupon = await this.prisma.coupon.findFirst({
      where: {
        isActive: true,
        showOnHome: true,
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gt: now } }],
        AND: [
          {
            OR: [
              { maxUsageCount: null },
              { maxUsageCount: { gt: this.prisma.coupon.fields.usedCount } },
            ],
          },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        currency: true,
      },
    });

    if (!coupon) return null;

    return {
      ...coupon,
      discountValue: Number(coupon.discountValue),
    };
  }

  async findAll(params: { skip?: number; take?: number }): Promise<{ items: any[]; total: number }> {
    const skip = Number.isFinite(params.skip) && (params.skip as number) >= 0 ? (params.skip as number) : 0;
    const take = Number.isFinite(params.take) && (params.take as number) > 0 ? (params.take as number) : 50;

    const [items, total] = await Promise.all([
      this.prisma.coupon.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.coupon.count(),
    ]);
    return { items, total };
  }

  async findOne(id: string): Promise<any> {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon ${id} not found.`);
    return coupon;
  }

  async update(id: string, data: any): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      if (data.showOnHome === true) {
        await tx.coupon.updateMany({
          where: {
            showOnHome: true,
            id: { not: id },
          },
          data: { showOnHome: false },
        });
      }

      return tx.coupon.update({
        where: { id },
        data,
      });
    });
  }

  async deactivate(id: string): Promise<any> {
    return this.prisma.coupon.update({ where: { id }, data: { isActive: false } });
  }
}
