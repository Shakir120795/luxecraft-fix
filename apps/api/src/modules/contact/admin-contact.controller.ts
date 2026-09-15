import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { ContactService } from './contact.service';

@Controller('admin/contact-messages')
@UseGuards(AdminJwtAuthGuard)
export class AdminContactController {
  constructor(private readonly contact: ContactService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.contact.findAllForAdmin(status);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.contact.updateStatus(id, body.status);
  }
}