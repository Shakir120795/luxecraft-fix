import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminPaymentsService {
  private readonly logger = new Logger(AdminPaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { status?: string; skip?: number; take?: number }): Promise<{ items: any[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: params.status ? { status: params.status as any } : {},
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: { createdAt: 'desc' },
        include: { order: { select: { orderNumber: true } } },
      }),
      this.prisma.payment.count({}),
    ]);
    return { items, total };
  }

  async findOne(id: string): Promise<any> {
    return this.prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    });
  }
}
