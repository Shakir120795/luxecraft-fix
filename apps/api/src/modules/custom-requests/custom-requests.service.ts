import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomRequest, CustomRequestStatus, Prisma } from '@prisma/client';

@Injectable()
export class CustomRequestsService {
  private readonly logger = new Logger(CustomRequestsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    title: string;
    description: string;
    dimensions?: string;
    designNotes?: string;
    preferredColors?: string;
    materialPreference?: string;
    quantityRequested?: number;
    budgetRange?: string;
    productId?: string;
    categoryId?: string;
  }): Promise<CustomRequest> {
    const customRequestNumber = await this.generateCustomRequestNumber();

    return this.prisma.customRequest.create({
      data: {
        customRequestNumber,
        userId: data.userId,
        title: data.title,
        description: data.description,
        dimensions: data.dimensions,
        designNotes: data.designNotes,
        preferredColors: data.preferredColors,
        materialPreference: data.materialPreference,
        quantityRequested: data.quantityRequested,
        budgetRange: data.budgetRange,
        productId: data.productId,
        categoryId: data.categoryId,
        status: CustomRequestStatus.SUBMITTED,
      },
      include: { messages: true, quotes: true, designs: true },
    });
  }

  async findOne(id: string): Promise<CustomRequest> {
    const req = await this.prisma.customRequest.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'desc' } }, quotes: true, designs: true },
    });
    if (!req) throw new NotFoundException(`Custom request ${id} not found.`);
    return req;
  }

  async findByCustomRequestNumber(customRequestNumber: string): Promise<CustomRequest> {
    const req = await this.prisma.customRequest.findUnique({
      where: { customRequestNumber },
      include: { messages: { orderBy: { createdAt: 'desc' } }, quotes: true, designs: true },
    });
    if (!req) throw new NotFoundException(`Custom request ${customRequestNumber} not found.`);
    return req;
  }

  async findAllForUser(userId: string): Promise<CustomRequest[]> {
    return this.prisma.customRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } }, quotes: { take: 1, orderBy: { createdAt: 'desc' } } },
    });
  }

  async findAll(params: {
    status?: CustomRequestStatus;
    userId?: string;
    skip?: number;
    take?: number;
  }): Promise<{ items: CustomRequest[]; total: number }> {
    const where: Prisma.CustomRequestWhereInput = {
      ...(params.status && { status: params.status }),
      ...(params.userId && { userId: params.userId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.customRequest.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: { createdAt: 'desc' },
        include: { messages: { take: 1 }, quotes: { take: 1 }, designs: { take: 1 } },
      }),
      this.prisma.customRequest.count({ where }),
    ]);

    return { items, total };
  }

  async updateStatus(id: string, status: CustomRequestStatus): Promise<CustomRequest> {
    return this.prisma.customRequest.update({
      where: { id },
      data: { status },
    });
  }

  private async generateCustomRequestNumber(): Promise<string> {
    const count = await this.prisma.customRequest.count();
    return `CR-${(count + 1).toString().padStart(6, '0')}`;
  }
}
