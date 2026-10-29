import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CustomRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class AdminCustomOrdersService {
  private readonly logger = new Logger(AdminCustomOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  async findAllRequests(params: { status?: string; skip?: number; take?: number }): Promise<{ items: any[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.customRequest.findMany({
        where: params.status ? { status: params.status as any } : {},
        skip: Number.isFinite(params.skip) ? params.skip : 0,
        take: Number.isFinite(params.take) ? params.take : 50,
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
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        messages: { orderBy: { createdAt: 'asc' } },
        quotes: { orderBy: { version: 'desc' } },
        designs: { orderBy: { version: 'desc' } },
      },
    });
    if (!req) throw new NotFoundException(`Custom request ${id} not found.`);
    return {
      ...req,
      messages: (req.messages ?? []).map((message) => ({
        ...message,
        attachments: (message.attachments ?? []).map(
          (url) => this.uploads.refreshCustomRequestAttachmentUrl(req.id, url) ?? url,
        ),
      })),
    };
  }

  async updateRequestStatus(id: string, status: string): Promise<any> {
    // Accept legacy admin labels while persisting only valid database enum values.
    const legacyStatusAliases: Record<string, CustomRequestStatus> = {
      PENDING: CustomRequestStatus.SUBMITTED,
      REVIEWING: CustomRequestStatus.UNDER_REVIEW,
      ACCEPTED: CustomRequestStatus.APPROVED,
    };
    const normalizedStatus =
      legacyStatusAliases[status] ??
      (Object.values(CustomRequestStatus).includes(status as CustomRequestStatus)
        ? (status as CustomRequestStatus)
        : null);

    if (!normalizedStatus) {
      throw new BadRequestException('Invalid custom request status.');
    }

    return this.prisma.customRequest.update({
      where: { id },
      data: { status: normalizedStatus },
    });
  }
}


