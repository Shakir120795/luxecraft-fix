import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRoles } from '../admin-auth/decorators/admin-roles.decorator';
import { AdminRolesGuard } from '../admin-auth/guards/admin-roles.guard';
import { AdminRole } from '@prisma/client';
import { ContactService } from './contact.service';

@Controller('admin/contact-messages')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class AdminContactController {
  constructor(private readonly contact: ContactService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.contact.findAllForAdmin(status);
  }

  @AdminRoles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.contact.updateStatus(id, body.status);
  }
}