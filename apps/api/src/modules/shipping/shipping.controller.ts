import { BadRequestException, Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ShippingService } from './shipping.service';

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
      currency: 'USD',
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

    return { rate: method.calculatedRate, currency: 'USD' };
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
