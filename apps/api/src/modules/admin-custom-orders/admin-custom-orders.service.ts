import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminCustomOrdersService {
  private readonly logger = new Logger(AdminCustomOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllRequests(params: { status?: string; skip?: number; take?: number }): Promise<{ items: any[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.customRequest.findMany({
        where: params.status ? { status: params.status as any } : {},
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true } }, _count: { select: { messages: true, quotes: true } } },
      }),
      this.prisma.customRequest.count({}),
    ]);

    return { items, total };
  }

  async getRequestDetail(id: string): Promise<any> {
    const req = await this.prisma.customRequest.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } }, quotes: { orderBy: { version: 'desc' } }, designs: { orderBy: { version: 'desc' } } },
    });
    if (!req) throw new NotFoundException(`Custom request ${id} not found.`);
    return req;
  }

  async updateRequestStatus(id: string, status: string): Promise<any> {
    return this.prisma.customRequest.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
