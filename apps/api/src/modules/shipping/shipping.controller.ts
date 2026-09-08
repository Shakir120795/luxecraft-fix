import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Get('methods')
  async methods(
    @Query('country') country?: string,
    @Query('weight') weight?: string,
    @Query('orderValue') orderValue?: string,
  ) {
    if (!country || country.length !== 2) {
      throw new BadRequestException('country must be a two-letter ISO country code.');
    }

    const methods = await this.shipping.calculateShippingRate({
      country: country.toUpperCase(),
      cartWeightKg: this.positiveNumber(weight, 'weight', 0),
      cartTotal: this.positiveNumber(orderValue, 'orderValue', 0),
    });

    return methods.map((method) => ({
      id: method.id,
      name: method.name,
      description: method.description,
      estimatedDays: method.deliveryDaysMax ?? method.deliveryDaysMin ?? null,
      rate: method.calculatedRate,
      currency: method.currency,
    }));
  }

  @Post('calculate')
  async calculate(
    @Body() body: { country?: string; shippingMethodId?: string; weight?: number; orderValue?: number },
  ) {
    if (!body.country || body.country.length !== 2 || !body.shippingMethodId) {
      throw new BadRequestException('country and shippingMethodId are required.');
    }

    const methods = await this.shipping.calculateShippingRate({
      country: body.country.toUpperCase(),
      cartWeightKg: this.positiveNumber(body.weight, 'weight', 0),
      cartTotal: this.positiveNumber(body.orderValue, 'orderValue', 0),
    });

    const method = methods.find((candidate) => candidate.id === body.shippingMethodId);
    if (!method) throw new BadRequestException('Shipping method is unavailable for this address.');

    return { rate: method.calculatedRate, currency: method.currency };
  }

  private positiveNumber(value: string | number | undefined, field: string, fallback: number): number {
    if (value === undefined || value === '') return fallback;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      throw new BadRequestException(`${field} must be a non-negative number.`);
    }
    return numeric;
  }
}

@Controller('admin/shipping')
@UseGuards(AdminJwtAuthGuard)
export class AdminShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Get('zones')
  listZones() {
    return this.shipping.adminListZones();
  }

  @Post('zones')
  createZone(@Body() body: { name?: string; countries?: string[]; isActive?: boolean }) {
    if (!body.name?.trim() || !Array.isArray(body.countries) || body.countries.length === 0) {
      throw new BadRequestException('name and at least one country are required.');
    }
    return this.shipping.adminCreateZone({
      name: body.name,
      countries: body.countries,
      isActive: body.isActive,
    });
  }

  @Patch('zones/:id')
  updateZone(
    @Param('id') id: string,
    @Body() body: { name?: string; countries?: string[]; isActive?: boolean },
  ) {
    return this.shipping.adminUpdateZone(id, body);
  }

  @Delete('zones/:id')
  async deleteZone(@Param('id') id: string) {
    await this.shipping.adminDeleteZone(id);
    return { success: true };
  }

  @Post('methods')
  createMethod(
    @Body()
    body: {
      zoneId?: string;
      name?: string;
      description?: string;
      deliveryDaysMin?: number;
      deliveryDaysMax?: number;
      basePrice?: number;
      pricePerKg?: number;
      freeShippingMin?: number | null;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    if (!body.zoneId || !body.name?.trim() || body.basePrice === undefined) {
      throw new BadRequestException('zoneId, name and basePrice are required.');
    }
    return this.shipping.adminCreateMethod({
      zoneId: body.zoneId,
      name: body.name,
      description: body.description,
      deliveryDaysMin: body.deliveryDaysMin,
      deliveryDaysMax: body.deliveryDaysMax,
      basePrice: Number(body.basePrice),
      pricePerKg: body.pricePerKg !== undefined ? Number(body.pricePerKg) : 0,
      freeShippingMin:
        body.freeShippingMin === null || body.freeShippingMin === undefined
          ? null
          : Number(body.freeShippingMin),
      isActive: body.isActive,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
    });
  }

  @Patch('methods/:id')
  updateMethod(
    @Param('id') id: string,
    @Body()
    body: {
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
    return this.shipping.adminUpdateMethod(id, {
      ...body,
      ...(body.basePrice !== undefined && { basePrice: Number(body.basePrice) }),
      ...(body.pricePerKg !== undefined && { pricePerKg: Number(body.pricePerKg) }),
      ...(body.freeShippingMin !== undefined &&
        body.freeShippingMin !== null && { freeShippingMin: Number(body.freeShippingMin) }),
    });
  }

  @Delete('methods/:id')
  async deleteMethod(@Param('id') id: string) {
    await this.shipping.adminDeleteMethod(id);
    return { success: true };
  }
}
