import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AuditEntry {
  adminId?: string;
  actor?: string;
  actorType?: 'admin' | 'customer' | 'system';
  action: string;
  resource: string;
  resourceId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Write an audit log entry. Never throws — audit failure must not break the main flow. */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          adminId: entry.adminId,
          actor: entry.actor ?? entry.adminId ?? 'system',
          actorType: entry.actorType ?? 'system',
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          before: entry.before as Prisma.InputJsonValue,
          after: entry.after as Prisma.InputJsonValue,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
    } catch (err) {
      // Audit failure must never crash the application
      this.logger.error('Failed to write audit log', err);
    }
  }

  /** Retrieve paginated audit logs for admin UI. */
  async findAll(params: {
    adminId?: string;
    resource?: string;
    action?: string;
    skip?: number;
    take?: number;
  }) {
    const { adminId, resource, action, skip = 0, take = 50 } = params;
    const where: Prisma.AuditLogWhereInput = {
      ...(adminId && { adminId }),
      ...(resource && { resource }),
      ...(action && { action }),
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, skip, take };
  }
}
