import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminReviewsService {
  private readonly logger = new Logger(AdminReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { status?: string; skip?: number; take?: number }): Promise<{ items: any[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: params.status ? { status: params.status } : {},
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true } }, user: { select: { email: true, firstName: true } } },
      }),
      this.prisma.review.count({}),
    ]);
    return { items, total };
  }

  async approve(id: string): Promise<any> {
    return this.prisma.review.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  async reject(id: string): Promise<any> {
    return this.prisma.review.update({ where: { id }, data: { status: 'REJECTED' } });
  }

  async hide(id: string): Promise<any> {
    return this.prisma.review.update({ where: { id }, data: { status: 'HIDDEN' } });
  }

  async feature(id: string): Promise<any> {
    return this.prisma.review.update({ where: { id }, data: { isFeatured: true } });
  }

  async unfeature(id: string): Promise<any> {
    return this.prisma.review.update({ where: { id }, data: { isFeatured: false } });
  }
}
