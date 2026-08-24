import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AdminUser, CategoryStatus } from '@prisma/client';

// ── Admin routes: /api/v1/admin/categories ─────────────────────

@Controller('admin/categories')
@UseGuards(AdminJwtAuthGuard)
export class AdminCategoriesController {
  constructor(private readonly svc: CategoriesService) {}

  @Post()
  create(@Body() dto: CreateCategoryDto, @CurrentAdmin() admin: AdminUser) {
    return this.svc.create(dto, admin.id);
  }

  @Get()
  findAll(
    @Query('status') status?: CategoryStatus,
    @Query('parentId') parentId?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.svc.findAllAdmin({ status, parentId, skip, take });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOneAdmin(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.svc.update(id, dto, admin.id);
  }

  @Patch(':id/hide')
  @HttpCode(HttpStatus.OK)
  hide(@Param('id') id: string, @CurrentAdmin() admin: AdminUser) {
    return this.svc.hide(id, admin.id);
  }

  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  archive(@Param('id') id: string, @CurrentAdmin() admin: AdminUser) {
    return this.svc.archive(id, admin.id);
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  restore(@Param('id') id: string, @CurrentAdmin() admin: AdminUser) {
    return this.svc.restore(id, admin.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentAdmin() admin: AdminUser) {
    return this.svc.softDelete(id, admin.id);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  reorder(@Body() dto: ReorderCategoriesDto, @CurrentAdmin() admin: AdminUser) {
    return this.svc.reorder(dto, admin.id);
  }
}

// ── Public routes: /api/v1/categories ─────────────────────────

@Controller('categories')
export class PublicCategoriesController {
  constructor(private readonly svc: CategoriesService) {}

  @Get()
  findAll() {
    return this.svc.findAllPublic();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.svc.findOneBySlug(slug);
  }
}
