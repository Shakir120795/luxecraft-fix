import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShippingMethod } from '@prisma/client';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateShippingRate(params: {
    country: string;
    cartWeightKg: number;
    cartTotal: number;
  }): Promise<ShippingMethod[]> {
    // Find zone for country
    const zones = await this.prisma.shippingZone.findMany({
      where: { isActive: true },
      include: { methods: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });

    const zone = zones.find((z) => z.countries.includes(params.country));
    if (!zone) return [];

    // Calculate rate for each method
    return zone.methods.map((method) => {
      const basePrice = Number(method.basePrice);
      const weightPrice = Number(method.pricePerKg) * params.cartWeightKg;
      const totalRate = basePrice + weightPrice;

      // Check free shipping threshold
      const freeShippingMin = method.freeShippingMin ? Number(method.freeShippingMin) : null;
      const finalRate =
        freeShippingMin && params.cartTotal >= freeShippingMin ? 0 : totalRate;

      return {
        ...method,
        calculatedRate: finalRate,
      } as ShippingMethod & { calculatedRate: number };
    });
  }

  async findAvailableMethods(country: string): Promise<ShippingMethod[]> {
    const zones = await this.prisma.shippingZone.findMany({
      where: { isActive: true },
      include: { methods: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });

    const zone = zones.find((z) => z.countries.includes(country));
    return zone?.methods || [];
  }
}
