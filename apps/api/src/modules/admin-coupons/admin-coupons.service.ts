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
  }): Promise<any> {
    return this.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        validFrom: data.validFrom,
        validTo: data.validTo,
        minOrderAmount: data.minOrderAmount,
        maxUsageCount: data.maxUsageCount,
        maxPerCustomer: data.maxPerCustomer,
      },
    });
  }

  async findAll(params: { skip?: number; take?: number }): Promise<{ items: any[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.coupon.findMany({
        skip: params.skip ?? 0,
        take: params.take ?? 50,
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
    return this.prisma.coupon.update({ where: { id }, data });
  }

  async deactivate(id: string): Promise<any> {
    return this.prisma.coupon.update({ where: { id }, data: { isActive: false } });
  }
}
