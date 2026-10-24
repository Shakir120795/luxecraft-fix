import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
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
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        currency: true,
        maxUsageCount: true,
        usedCount: true,
        reservedCount: true,
      },
    });

    if (!coupon) return null;

    // Hide exhausted offers as soon as their final use has been redeemed or
    // reserved by a pending checkout.
    if (
      coupon.maxUsageCount != null &&
      coupon.usedCount + coupon.reservedCount >= coupon.maxUsageCount
    ) {
      return null;
    }

    return {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      currency: coupon.currency,
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
    if (
      data?.usedCount !== undefined &&
      (!Number.isInteger(Number(data.usedCount)) || Number(data.usedCount) < 0)
    ) {
      throw new BadRequestException('Already redeemed uses must be a non-negative whole number.');
    }

    if (
      data?.maxUsageCount !== undefined &&
      data.maxUsageCount !== null &&
      (!Number.isInteger(Number(data.maxUsageCount)) || Number(data.maxUsageCount) < 1)
    ) {
      throw new BadRequestException('Maximum uses must be a positive whole number or blank.');
    }

    if (
      data?.maxPerCustomer !== undefined &&
      data.maxPerCustomer !== null &&
      (!Number.isInteger(Number(data.maxPerCustomer)) || Number(data.maxPerCustomer) < 1)
    ) {
      throw new BadRequestException('Uses per customer must be a positive whole number or blank.');
    }

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

      const updatedCoupon = await tx.coupon.update({
        where: { id },
        data,
      });

      // If an admin backfills historical redemptions or lowers the global
      // limit below the already-used/reserved count, deactivate the exhausted
      // coupon and clear its homepage flag immediately.
      if (
        updatedCoupon.maxUsageCount != null &&
        updatedCoupon.usedCount >= updatedCoupon.maxUsageCount &&
        updatedCoupon.isActive
      ) {
        return tx.coupon.update({
          where: { id },
          data: { isActive: false, showOnHome: false },
        });
      }

      return updatedCoupon;
    });
  }

  async deactivate(id: string): Promise<any> {
    return this.prisma.coupon.update({ where: { id }, data: { isActive: false } });
  }
}
