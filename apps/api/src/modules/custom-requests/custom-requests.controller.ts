import { Controller, Post, Get, Param, UseGuards, Body } from '@nestjs/common';
import { CustomRequestsService } from './custom-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('custom-requests')
export class CustomRequestsController {
  constructor(private readonly svc: CustomRequestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { userId: string }, @Body() data: any) {
    return this.svc.create({ userId: user.userId, ...data });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: { userId: string }) {
    return this.svc.findAllForUser(user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }
}
