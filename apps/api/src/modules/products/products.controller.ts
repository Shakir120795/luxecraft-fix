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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { AddMediaDto } from './dto/add-media.dto';
import { AddCustomizationOptionDto } from './dto/add-customization-option.dto';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AdminUser, ProductStatus } from '@prisma/client';

// ── Admin routes: /api/v1/admin/products ───────────────────────

@Controller('admin/products')
@UseGuards(AdminJwtAuthGuard)
export class AdminProductsController {
  constructor(private readonly svc: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto, @CurrentAdmin() admin: AdminUser) {
    return this.svc.create(dto, admin.id);
  }

  @Get()
  findAll(
    @Query('status') status?: ProductStatus,
    @Query('categoryId') categoryId?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.svc.findAllAdmin({
      status,
      categoryId,
      isFeatured: isFeatured === 'true' ? true : undefined,
      skip,
      take,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOneAdmin(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.svc.update(id, dto, admin.id);
  }

  @Patch(':id/publish')
  @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string, @CurrentAdmin() admin: AdminUser) {
    return this.svc.publish(id, admin.id);
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

  // ── Variants ─────────────────────────────────────────────────

  @Post(':id/variants')
  addVariant(
    @Param('id') id: string,
    @Body() dto: CreateVariantDto,
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.svc.addVariant(id, dto, admin.id);
  }

  @Patch('variants/:variantId')
  updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: Partial<CreateVariantDto>,
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.svc.updateVariant(variantId, dto, admin.id);
  }

  @Delete('variants/:variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteVariant(
    @Param('variantId') variantId: string,
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.svc.deleteVariant(variantId, admin.id);
  }

  // ── Media ────────────────────────────────────────────────────

  @Post(':id/media')
  addMedia(
    @Param('id') id: string,
    @Body() dto: AddMediaDto,
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.svc.addMedia(id, dto, admin.id);
  }

  @Patch('media/:mediaId')
  updateMedia(
    @Param('mediaId') mediaId: string,
    @Body() dto: Partial<AddMediaDto>,
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.svc.updateMedia(mediaId, dto, admin.id);
  }

  @Delete('media/:mediaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMedia(@Param('mediaId') mediaId: string, @CurrentAdmin() admin: AdminUser) {
    return this.svc.deleteMedia(mediaId, admin.id);
  }

  // ── Customization Options ────────────────────────────────────

  @Post(':id/customization-options')
  addCustomizationOption(
    @Param('id') id: string,
    @Body() dto: AddCustomizationOptionDto,
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.svc.addCustomizationOption(id, dto, admin.id);
  }

  @Patch('customization-options/:optionId')
  updateCustomizationOption(
    @Param('optionId') optionId: string,
    @Body() dto: Partial<AddCustomizationOptionDto>,
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.svc.updateCustomizationOption(optionId, dto, admin.id);
  }

  @Delete('customization-options/:optionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCustomizationOption(
    @Param('optionId') optionId: string,
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.svc.deleteCustomizationOption(optionId, admin.id);
  }
}

// ── Public routes: /api/v1/products ────────────────────────────

@Controller('products')
export class PublicProductsController {
  constructor(private readonly svc: ProductsService) {}

  @Get()
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.svc.findAllPublic({
      categoryId,
      isFeatured: isFeatured === 'true' ? true : undefined,
      skip,
      take,
    });
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.svc.findOneBySlugPublic(slug);
  }
}
