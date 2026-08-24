import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomDesign, DesignApprovalStatus } from '@prisma/client';

@Injectable()
export class CustomDesignsService {
  private readonly logger = new Logger(CustomDesignsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    customRequestId: string;
    designFileUrl: string;
    designFileKey?: string;
    designPreviewUrl?: string;
    description?: string;
    uploadedBy: string;
  }): Promise<CustomDesign> {
    const req = await this.prisma.customRequest.findUnique({
      where: { id: data.customRequestId },
    });
    if (!req) throw new NotFoundException(`Custom request not found.`);

    // Get next version
    const latestDesign = await this.prisma.customDesign.findFirst({
      where: { customRequestId: data.customRequestId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latestDesign?.version ?? 0) + 1;

    return this.prisma.customDesign.create({
      data: {
        customRequestId: data.customRequestId,
        version: nextVersion,
        designFileUrl: data.designFileUrl,
        designFileKey: data.designFileKey,
        designPreviewUrl: data.designPreviewUrl,
        description: data.description,
        uploadedBy: data.uploadedBy,
        approvalStatus: DesignApprovalStatus.PENDING,
      },
    });
  }

  async findOne(id: string): Promise<CustomDesign> {
    const design = await this.prisma.customDesign.findUnique({ where: { id } });
    if (!design) throw new NotFoundException(`Design ${id} not found.`);
    return design;
  }

  async findAllForRequest(customRequestId: string): Promise<CustomDesign[]> {
    return this.prisma.customDesign.findMany({
      where: { customRequestId },
      orderBy: { version: 'asc' },
    });
  }

  async approve(id: string, approvedBy: string): Promise<CustomDesign> {
    return this.prisma.customDesign.update({
      where: { id },
      data: {
        approvalStatus: DesignApprovalStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy,
      },
    });
  }

  async reject(id: string, rejectionReason: string): Promise<CustomDesign> {
    return this.prisma.customDesign.update({
      where: { id },
      data: {
        approvalStatus: DesignApprovalStatus.REJECTED,
        rejectionReason,
      },
    });
  }

  async requestRevision(id: string): Promise<CustomDesign> {
    return this.prisma.customDesign.update({
      where: { id },
      data: { approvalStatus: DesignApprovalStatus.REVISION_REQUESTED },
    });
  }
}
