import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomQuote, QuoteStatus, Prisma } from '@prisma/client';

@Injectable()
export class CustomQuotesService {
  private readonly logger = new Logger(CustomQuotesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    customRequestId: string;
    baseProductPrice: number;
    designFee: number;
    materialFee?: number;
    dimensionFee?: number;
    rushFee?: number;
    subtotal: number;
    discount?: number;
    shippingEstimate?: number;
    taxEstimate?: number;
    total: number;
    currency?: string;
    description?: string;
    expiresAt?: Date;
  }): Promise<CustomQuote> {
    const req = await this.prisma.customRequest.findUnique({
      where: { id: data.customRequestId },
    });
    if (!req) throw new NotFoundException(`Custom request not found.`);

    // Get next version
    const latestQuote = await this.prisma.customQuote.findFirst({
      where: { customRequestId: data.customRequestId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latestQuote?.version ?? 0) + 1;

    const quoteNumber = await this.generateQuoteNumber();

    return this.prisma.customQuote.create({
      data: {
        customRequestId: data.customRequestId,
        quoteNumber,
        version: nextVersion,
        baseProductPrice: new Prisma.Decimal(data.baseProductPrice),
        designFee: new Prisma.Decimal(data.designFee),
        materialFee: new Prisma.Decimal(data.materialFee ?? 0),
        dimensionFee: new Prisma.Decimal(data.dimensionFee ?? 0),
        rushFee: new Prisma.Decimal(data.rushFee ?? 0),
        subtotal: new Prisma.Decimal(data.subtotal),
        discount: new Prisma.Decimal(data.discount ?? 0),
        shippingEstimate: new Prisma.Decimal(data.shippingEstimate ?? 0),
        taxEstimate: new Prisma.Decimal(data.taxEstimate ?? 0),
        total: new Prisma.Decimal(data.total),
        currency: data.currency ?? 'USD',
        description: data.description,
        expiresAt: data.expiresAt,
        status: QuoteStatus.DRAFT,
        customerStatus: QuoteStatus.PENDING,
      },
    });
  }

  async findOne(id: string): Promise<CustomQuote> {
    const quote = await this.prisma.customQuote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException(`Quote ${id} not found.`);
    return quote;
  }

  async findAllForRequest(customRequestId: string): Promise<CustomQuote[]> {
    return this.prisma.customQuote.findMany({
      where: { customRequestId },
      orderBy: { version: 'asc' },
    });
  }

  async updateStatus(
    id: string,
    status: QuoteStatus,
    customerStatus?: QuoteStatus,
  ): Promise<CustomQuote> {
    return this.prisma.customQuote.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(customerStatus && { customerStatus }),
      },
    });
  }

  async customerAcceptQuote(id: string): Promise<CustomQuote> {
    return this.updateStatus(id, QuoteStatus.ACCEPTED, QuoteStatus.ACCEPTED);
  }

  async customerRejectQuote(id: string): Promise<CustomQuote> {
    return this.updateStatus(id, QuoteStatus.REJECTED, QuoteStatus.REJECTED);
  }

  async customerRequestRevision(id: string): Promise<CustomQuote> {
    return this.updateStatus(id, QuoteStatus.REVISED, QuoteStatus.PENDING);
  }

  private async generateQuoteNumber(): Promise<string> {
    const count = await this.prisma.customQuote.count();
    return `QT-${(count + 1).toString().padStart(6, '0')}`;
  }
}
