import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminCustomersService {
  private readonly logger = new Logger(AdminCustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { search?: string; status?: string; skip?: number; take?: number }): Promise<{ items: any[]; total: number }> {
    const skip = Number.isFinite(params.skip) ? Math.max(0, params.skip as number) : 0;
    const take = Number.isFinite(params.take) ? Math.min(50, Math.max(1, params.take as number)) : 50;

    const where: Prisma.UserWhereInput = {
      ...(params.search && {
        OR: [
          { email: { contains: params.search, mode: 'insensitive' } },
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
      ...(params.status && { status: params.status as any }),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, firstName: true, lastName: true, status: true, emailVerified: true, createdAt: true, lastLoginAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 10 },
        addresses: true,        wishlists: { include: { items: { include: { product: { select: { id: true, name: true, slug: true, regularPrice: true, salePrice: true, status: true } }, variant: { select: { id: true, name: true, regularPrice: true, salePrice: true, isAvailable: true } } } } } },
        customRequests: { take: 5 },
        _count: { select: { orders: true, customRequests: true } },
      },
    });
    if (!user) throw new NotFoundException(`Customer ${id} not found.`);

    const totalSpent = await this.prisma.order.aggregate({
      where: { userId: id, paymentStatus: 'PAID' },
      _sum: { total: true },
    });

    return { ...user, totalSpent: totalSpent._sum.total ?? 0 };
  }

  async deleteUnverified(id: string): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { orders: true, customRequests: true } },
      },
    });

    if (!user) throw new NotFoundException('Customer not found.');
    if (user.emailVerified) throw new Error('Verified customer accounts cannot be deleted.');
    if (user._count.orders > 0 || user._count.customRequests > 0) {
      throw new Error('Customer has existing business activity and cannot be deleted.');
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async updateStatus(id: string, status: string): Promise<any> {
    return this.prisma.user.update({
      where: { id },
      data: { status: status as any },
    });
  }
}




