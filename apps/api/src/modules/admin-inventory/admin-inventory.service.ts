import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminInventoryService {
  private readonly logger = new Logger(AdminInventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getLowStockVariants(threshold: number = 10): Promise<any[]> {
    return this.prisma.productVariant.findMany({
      where: { stockQty: { lte: threshold }, trackInventory: true },
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { stockQty: 'asc' },
    });
  }

  async getInventoryHistory(variantId: string, limit: number = 50): Promise<any[]> {
    return this.prisma.inventoryLog.findMany({
      where: { variantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async adjustInventory(variantId: string, delta: number, reason: string): Promise<any> {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    const newQty = Math.max(0, (variant?.stockQty ?? 0) + delta);

    await this.prisma.inventoryLog.create({
      data: {
        variantId,
        changeType: 'MANUAL_ADJUST',
        delta,
        qtyBefore: variant?.stockQty ?? 0,
        qtyAfter: newQty,
        reason,
      },
    });

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stockQty: newQty },
    });
  }
}
