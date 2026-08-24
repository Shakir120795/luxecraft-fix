import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRefreshDto } from './dto/admin-refresh.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AdminUser } from '@prisma/client';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  /** POST /api/v1/admin/auth/login */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: AdminLoginDto, @Req() req: Request) {
    return this.adminAuth.login(dto.email, dto.password, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  /** POST /api/v1/admin/auth/refresh */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: AdminRefreshDto, @Req() req: Request) {
    return this.adminAuth.refresh(dto.refreshToken, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  /** POST /api/v1/admin/auth/logout */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtAuthGuard)
  async logout(
    @Body() dto: AdminRefreshDto,
    @CurrentAdmin() admin: AdminUser,
    @Req() req: Request,
  ) {
    await this.adminAuth.logout(dto.refreshToken, admin, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return { message: 'Admin logged out successfully.' };
  }

  /** GET /api/v1/admin/auth/me */
  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  async me(@CurrentAdmin() admin: AdminUser) {
    return this.adminAuth.sanitize(admin);
  }

  /**
   * POST /api/v1/admin/auth/create-admin
   * Create a new Super Admin account.
   * Requires existing Super Admin auth.
   * In a fresh deployment (no admins yet), a seed script is used instead.
   */
  @Post('create-admin')
  @UseGuards(AdminJwtAuthGuard, SuperAdminGuard)
  async createAdmin(
    @Body() dto: CreateAdminDto,
    @CurrentAdmin() requestingAdmin: AdminUser,
  ) {
    return this.adminAuth.createSuperAdmin(dto, requestingAdmin.id);
  }
}
