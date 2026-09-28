import { Controller, Get, Param, Req, UseGuards, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';
import { getGuestOrderAccessCookieName } from './guest-order-access';

@Controller('orders')
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: { id: string }) {
    return this.svc.findAllForUser(user.id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.svc.cancelForUser(id, user.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @Req() req: Request & { user?: { id: string } },
  ) {
    if (req.user?.id) return this.svc.findOneForUser(id, req.user.id);

    const accessToken = req.cookies?.[getGuestOrderAccessCookieName(id)] ?? '';
    return this.svc.findOneForGuest(id, accessToken);
  }
}
