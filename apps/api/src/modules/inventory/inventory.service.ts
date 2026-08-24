import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InventoryLog, InventoryChange, ProductVariant } from '@prisma/client';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── Admin: Manual adjust ───────────────────────────────────────

  async adjust(dto: AdjustInventoryDto, adminId: string): Promise<InventoryLog> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: dto.variantId, deletedAt: null },
      include: { product: true },
    });
    if (!variant) throw new NotFoundException(`Variant ${dto.variantId} not found.`);

    const qtyBefore = variant.stockQty;
    const qtyAfter = qtyBefore + dto.delta;

    if (qtyAfter < 0) {
      throw new BadRequestException(
        `Adjustment would result in negative stock (${qtyAfter}). Current: ${qtyBefore}, delta: ${dto.delta}.`,
      );
    }

    // Update variant stock
    await this.prisma.productVariant.update({
      where: { id: dto.variantId },
      data: { stockQty: qtyAfter },
    });

    // Log the change
    const log = await this.prisma.inventoryLog.create({
      data: {
        productId: variant.productId,
        variantId: dto.variantId,
        adminId,
        changeType: dto.changeType,
        delta: dto.delta,
        qtyBefore,
        qtyAfter,
        reason: dto.reason,
        reference: dto.reference,
      },
    });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'INVENTORY_ADJUSTED',
      resource: 'inventory_logs',
      resourceId: log.id,
      after: {
        variantId: dto.variantId,
        changeType: dto.changeType,
        delta: dto.delta,
        qtyBefore,
        qtyAfter,
      },
    });

    return log;
  }

  // ── Reserve & Release (for order processing) ───────────────────

  async reserve(variantId: string, qty: number, reference: string): Promise<InventoryLog> {
    if (qty <= 0) throw new BadRequestException('Reserve quantity must be positive.');

    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, deletedAt: null },
      include: { product: true },
    });
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found.`);

    const availableQty = variant.stockQty - variant.reservedQty;
    if (availableQty < qty && !variant.allowBackorder) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${availableQty}, requested: ${qty}.`,
      );
    }

    // Increase reserved quantity
    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { reservedQty: { increment: qty } },
    });

    const log = await this.prisma.inventoryLog.create({
      data: {
        productId: variant.productId,
        variantId,
        changeType: InventoryChange.ORDER_RESERVE,
        delta: -qty,
        qtyBefore: variant.stockQty,
        qtyAfter: variant.stockQty,
        reason: 'Order reservation',
        reference,
      },
    });

    return log;
  }

  async release(variantId: string, qty: number, reference: string): Promise<InventoryLog> {
    if (qty <= 0) throw new BadRequestException('Release quantity must be positive.');

    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, deletedAt: null },
      include: { product: true },
    });
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found.`);

    if (variant.reservedQty < qty) {
      throw new BadRequestException(
        `Cannot release ${qty}. Reserved: ${variant.reservedQty}.`,
      );
    }

    // Decrease reserved quantity
    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { reservedQty: { decrement: qty } },
    });

    const log = await this.prisma.inventoryLog.create({
      data: {
        productId: variant.productId,
        variantId,
        changeType: InventoryChange.ORDER_RELEASE,
        delta: qty,
        qtyBefore: variant.stockQty,
        qtyAfter: variant.stockQty,
        reason: 'Order released (cancelled/expired)',
        reference,
      },
    });

    return log;
  }

  async deduct(variantId: string, qty: number, reference: string): Promise<InventoryLog> {
    if (qty <= 0) throw new BadRequestException('Deduct quantity must be positive.');

    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, deletedAt: null },
      include: { product: true },
    });
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found.`);

    if (variant.reservedQty < qty) {
      throw new BadRequestException(
        `Cannot deduct ${qty}. Reserved: ${variant.reservedQty}.`,
      );
    }

    const qtyBefore = variant.stockQty;
    const qtyAfter = qtyBefore - qty;

    if (qtyAfter < 0) {
      throw new BadRequestException(
        `Deduction would result in negative stock. Current: ${qtyBefore}, deduct: ${qty}.`,
      );
    }

    // Decrease stock and reserved
    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        stockQty: { decrement: qty },
        reservedQty: { decrement: qty },
      },
    });

    const log = await this.prisma.inventoryLog.create({
      data: {
        productId: variant.productId,
        variantId,
        changeType: InventoryChange.ORDER_DEDUCT,
        delta: -qty,
        qtyBefore,
        qtyAfter,
        reason: 'Order fulfilled',
        reference,
      },
    });

    return log;
  }

  // ── Low-stock detection ────────────────────────────────────────

  async findLowStock(): Promise<ProductVariant[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: {
        deletedAt: null,
        trackInventory: true,
        isAvailable: true,
        lowStockAt: { not: null },
      },
      include: { product: { select: { id: true, name: true, slug: true } } },
    });

    return variants.filter((v) => v.lowStockAt && v.stockQty <= v.lowStockAt);
  }

  // ── History ────────────────────────────────────────────────────

  async findLogs(params: {
    productId?: string;
    variantId?: string;
    changeType?: InventoryChange;
    skip?: number;
    take?: number;
  }): Promise<{ items: InventoryLog[]; total: number }> {
    const where: Record<string, unknown> = {
      ...(params.productId && { productId: params.productId }),
      ...(params.variantId && { variantId: params.variantId }),
      ...(params.changeType && { changeType: params.changeType }),
    };

    const [items, total] = await Promise.all([
      this.prisma.inventoryLog.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 100,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true } },
          variant: { select: { id: true, name: true } },
          admin: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.inventoryLog.count({ where }),
    ]);

    return { items, total };
  }
}
