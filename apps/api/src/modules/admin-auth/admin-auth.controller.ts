import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRefreshDto } from './dto/admin-refresh.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AdminUser } from '@prisma/client';

const ADMIN_REFRESH_COOKIE = 'wolhomes_admin_refresh_token';
const ADMIN_REFRESH_COOKIE_PATH = '/api/v1/admin/auth';
const ADMIN_REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: ADMIN_REFRESH_COOKIE_PATH,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  /** POST /api/v1/admin/auth/login */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: AdminLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.adminAuth.login(dto.email, dto.password, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie(ADMIN_REFRESH_COOKIE, tokens.refreshToken, ADMIN_REFRESH_COOKIE_OPTIONS);
    const { refreshToken: _refreshToken, ...safeResponse } = tokens;
    return safeResponse;
  }

  /** POST /api/v1/admin/auth/refresh */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: AdminRefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[ADMIN_REFRESH_COOKIE] ?? dto?.refreshToken ?? '';
    const tokens = await this.adminAuth.refresh(refreshToken, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie(ADMIN_REFRESH_COOKIE, tokens.refreshToken, ADMIN_REFRESH_COOKIE_OPTIONS);
    const { refreshToken: _refreshToken, ...safeResponse } = tokens;
    return safeResponse;
  }

  /** POST /api/v1/admin/auth/logout */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtAuthGuard)
  async logout(
    @Body() dto: AdminRefreshDto,
    @CurrentAdmin() admin: AdminUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[ADMIN_REFRESH_COOKIE] ?? dto?.refreshToken ?? '';
    res.clearCookie(ADMIN_REFRESH_COOKIE, ADMIN_REFRESH_COOKIE_OPTIONS);
    await this.adminAuth.logout(refreshToken, admin, {
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
