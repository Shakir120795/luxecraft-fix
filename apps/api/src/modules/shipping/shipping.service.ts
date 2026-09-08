import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShippingMethod } from '@prisma/client';

export type CalculatedShippingMethod = ShippingMethod & { calculatedRate: number; currency: string };

const COUNTRY_CURRENCY: Record<string, string> = { IN: 'INR', US: 'USD', CA: 'CAD', GB: 'GBP', AU: 'AUD', AE: 'AED', EU: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', JP: 'JPY', SG: 'SGD', NZ: 'NZD', CH: 'CHF', CN: 'CNY' };

function currencyForCountry(country: string): string { return COUNTRY_CURRENCY[country.toUpperCase()] ?? 'USD'; }

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateShippingRate(params: {
    country: string;
    cartWeightKg: number;
    cartTotal: number;
  }): Promise<CalculatedShippingMethod[]> {
    const zones = await this.prisma.shippingZone.findMany({
      where: { isActive: true },
      include: { methods: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });

    const zone = zones.find((z) => z.countries.includes('*') || z.countries.includes(params.country));
    if (!zone) return [];

    return zone.methods.map((method) => {
      const basePrice = Number(method.basePrice);
      const weightPrice = Number(method.pricePerKg) * params.cartWeightKg;
      const totalRate = basePrice + weightPrice;
      const freeShippingMin = method.freeShippingMin ? Number(method.freeShippingMin) : null;
      const finalRate = 0;

      return {
        ...method,
        calculatedRate: finalRate,
        currency: currencyForCountry(params.country),
      } as CalculatedShippingMethod;
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

  async adminListZones() {
    return this.prisma.shippingZone.findMany({
      include: { methods: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async adminCreateZone(data: { name: string; countries: string[]; isActive?: boolean }) {
    const countries = [...new Set(data.countries.map((country) => country.trim().toUpperCase()).filter(Boolean))];
    if (countries.length !== 1) throw new BadRequestException('Each shipping country must have its own shipping rate.' );
    const existingZone = await this.prisma.shippingZone.findFirst({
      where: { countries: { has: countries[0] } },
    });
    if (existingZone) throw new BadRequestException(`Shipping for ${countries[0]} already exists.`);

    return this.prisma.shippingZone.create({
      data: {
        name: data.name.trim(),
        countries,
        isActive: data.isActive ?? true,
      },
      include: { methods: true },
    });
  }

  async adminUpdateZone(
    id: string,
    data: { name?: string; countries?: string[]; isActive?: boolean },
  ) {
    return this.prisma.shippingZone.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.countries !== undefined && {
          countries: [...new Set(data.countries.map((country) => country.trim().toUpperCase()).filter(Boolean))],
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { methods: true },
    });
  }

  async adminDeleteZone(id: string) {
    await this.prisma.shippingZone.delete({ where: { id } });
  }

  async adminCreateMethod(data: {
    zoneId: string;
    name: string;
    description?: string;
    deliveryDaysMin?: number;
    deliveryDaysMax?: number;
    basePrice: number;
    pricePerKg?: number;
    freeShippingMin?: number | null;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    return this.prisma.shippingMethod.create({
      data: {
        zoneId: data.zoneId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        deliveryDaysMin: data.deliveryDaysMin ?? null,
        deliveryDaysMax: data.deliveryDaysMax ?? null,
        basePrice: data.basePrice,
        pricePerKg: data.pricePerKg ?? 0,
        freeShippingMin: data.freeShippingMin ?? null,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async adminUpdateMethod(
    id: string,
    data: {
      zoneId?: string;
      name?: string;
      description?: string | null;
      deliveryDaysMin?: number | null;
      deliveryDaysMax?: number | null;
      basePrice?: number;
      pricePerKg?: number;
      freeShippingMin?: number | null;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.prisma.shippingMethod.update({
      where: { id },
      data: {
        ...(data.zoneId !== undefined && { zoneId: data.zoneId }),
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.deliveryDaysMin !== undefined && { deliveryDaysMin: data.deliveryDaysMin }),
        ...(data.deliveryDaysMax !== undefined && { deliveryDaysMax: data.deliveryDaysMax }),
        ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
        ...(data.pricePerKg !== undefined && { pricePerKg: data.pricePerKg }),
        ...(data.freeShippingMin !== undefined && { freeShippingMin: data.freeShippingMin }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  }

  async adminDeleteMethod(id: string) {
    await this.prisma.shippingMethod.delete({ where: { id } });
  }
}






