import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';

@Controller('orders')
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: { id: string }) {
    return this.svc.findAllForUser(user.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @Query('access') accessToken: string | undefined,
    @Req() req: Request & { user?: { id: string } },
  ) {
    if (req.user?.id) return this.svc.findOneForUser(id, req.user.id);
    if (!accessToken) return this.svc.findOneForGuest(id, '');
    return this.svc.findOneForGuest(id, accessToken);
  }
}
