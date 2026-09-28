import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutOrderDto } from './dto/create-checkout-order.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { getGuestOrderAccessCookieName, getGuestOrderAccessCookieOptions } from '../orders/guest-order-access';

interface CheckoutRequest extends Request {
  user?: { id: string };
}

@Controller('checkout')
@UseGuards(OptionalJwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post('create-order')
  async createOrder(
    @Body() dto: CreateCheckoutOrderDto,
    @Req() req: CheckoutRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    const result = await this.checkout.createStandardOrder({
      userId: req.user?.id,
      sessionId: typeof sessionId === 'string' ? sessionId : undefined,
      dto,
    });

    if (!req.user?.id && result.order?.id && result.guestAccessToken) {
      const cookieName = getGuestOrderAccessCookieName(result.order.id);
      res.cookie(cookieName, result.guestAccessToken, getGuestOrderAccessCookieOptions());
      const { guestAccessToken: _guestAccessToken, ...safeResult } = result;
      return safeResult;
    }

    return result;
  }
}
