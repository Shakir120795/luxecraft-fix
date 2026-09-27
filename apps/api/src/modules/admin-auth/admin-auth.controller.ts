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
import { AdminTwoFactorVerifyDto } from './dto/admin-2fa-verify.dto';
import { AdminTwoFactorConfirmDto } from './dto/admin-2fa-confirm.dto';
import { AdminTwoFactorDisableDto } from './dto/admin-2fa-disable.dto';
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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: AdminLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.adminAuth.login(dto.email, dto.password, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if ('accessToken' in result) {
      res.cookie(ADMIN_REFRESH_COOKIE, result.refreshToken, ADMIN_REFRESH_COOKIE_OPTIONS);
      const { refreshToken: _refreshToken, ...safeResponse } = result;
      return safeResponse;
    }

    return result;
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyTwoFactor(
    @Body() dto: AdminTwoFactorVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.adminAuth.verifyTwoFactor(dto.challengeToken, dto.code, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie(ADMIN_REFRESH_COOKIE, result.refreshToken, ADMIN_REFRESH_COOKIE_OPTIONS);
    const { refreshToken: _refreshToken, ...safeResponse } = result;
    return safeResponse;
  }

  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtAuthGuard)
  async setupTwoFactor(@CurrentAdmin() admin: AdminUser) {
    return this.adminAuth.beginTwoFactorSetup(admin.id);
  }

  @Post('2fa/confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtAuthGuard)
  async confirmTwoFactor(
    @Body() dto: AdminTwoFactorConfirmDto,
    @CurrentAdmin() admin: AdminUser,
    @Req() req: Request,
  ) {
    await this.adminAuth.confirmTwoFactorSetup(admin, dto.password, dto.code, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return { twoFactorEnabled: true };
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtAuthGuard)
  async disableTwoFactor(
    @Body() dto: AdminTwoFactorDisableDto,
    @CurrentAdmin() admin: AdminUser,
    @Req() req: Request,
  ) {
    await this.adminAuth.disableTwoFactor(admin, dto.password, dto.code, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return { twoFactorEnabled: false };
  }

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

  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  async me(@CurrentAdmin() admin: AdminUser) {
    return this.adminAuth.sanitize(admin);
  }

  @Post('create-admin')
  @UseGuards(AdminJwtAuthGuard, SuperAdminGuard)
  async createAdmin(
    @Body() dto: CreateAdminDto,
    @CurrentAdmin() requestingAdmin: AdminUser,
  ) {
    return this.adminAuth.createSuperAdmin(dto, requestingAdmin.id);
  }
}
