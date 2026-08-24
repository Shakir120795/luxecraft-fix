import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutOrderDto } from './dto/create-checkout-order.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

interface CheckoutRequest extends Request {
  user?: { id: string };
}

@Controller('checkout')
@UseGuards(OptionalJwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post('create-order')
  createOrder(@Body() dto: CreateCheckoutOrderDto, @Req() req: CheckoutRequest) {
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    return this.checkout.createStandardOrder({
      userId: req.user?.id,
      sessionId: typeof sessionId === 'string' ? sessionId : undefined,
      dto,
    });
  }
}
