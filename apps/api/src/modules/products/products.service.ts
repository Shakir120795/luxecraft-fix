import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  Product,
  ProductStatus,
  ProductVariant,
  ProductMedia,
  ProductCustomizationOption,
  Prisma,
} from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { AddMediaDto } from './dto/add-media.dto';
import { AddCustomizationOptionDto } from './dto/add-customization-option.dto';
import { uniqueSlug } from '../../common/utils/slug.util';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── Admin: Create Product ──────────────────────────────────────

  async create(dto: CreateProductDto, adminId: string): Promise<Product> {
    const slug = await this.resolveSlug(dto.slug, dto.name);

    const product = await this.prisma.product.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        slug,
        sku: dto.sku,
        description: dto.description,
        shortDescription: dto.shortDescription,
        regularPrice: dto.regularPrice,
        salePrice: dto.salePrice,
        currency: dto.currency ?? 'USD',
        status: dto.status ?? ProductStatus.DRAFT,
        weightKg: dto.weightKg,
        lengthCm: dto.lengthCm,
        widthCm: dto.widthCm,
        heightCm: dto.heightCm,
        seoTitle: dto.seoTitle,
        seoDesc: dto.seoDesc,
        trackInventory: dto.trackInventory ?? true,
        allowBackorder: dto.allowBackorder ?? false,
        isFeatured: dto.isFeatured ?? false,
        isCustomizable: dto.isCustomizable ?? false,
      },
    });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'PRODUCT_CREATED',
      resource: 'products',
      resourceId: product.id,
      after: { name: product.name, slug: product.slug, status: product.status },
    });

    return product;
  }

  // ── Admin: Update Product ──────────────────────────────────────

  async update(
    id: string,
    dto: UpdateProductDto,
    adminId: string,
  ): Promise<Product> {
    const existing = await this.findOneOrFail(id);

    let slug = existing.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      slug = await this.resolveSlug(dto.slug, dto.slug, id);
    } else if (dto.name && !dto.slug) {
      slug = await this.resolveSlug(undefined, dto.name, id);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.name && { name: dto.name }),
        slug,
        ...(dto.sku !== undefined && { sku: dto.sku }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.shortDescription !== undefined && { shortDescription: dto.shortDescription }),
        ...(dto.regularPrice !== undefined && { regularPrice: dto.regularPrice }),
        ...(dto.salePrice !== undefined && { salePrice: dto.salePrice }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.status && { status: dto.status }),
        ...(dto.weightKg !== undefined && { weightKg: dto.weightKg }),
        ...(dto.lengthCm !== undefined && { lengthCm: dto.lengthCm }),
        ...(dto.widthCm !== undefined && { widthCm: dto.widthCm }),
        ...(dto.heightCm !== undefined && { heightCm: dto.heightCm }),
        ...(dto.seoTitle !== undefined && { seoTitle: dto.seoTitle }),
        ...(dto.seoDesc !== undefined && { seoDesc: dto.seoDesc }),
        ...(dto.trackInventory !== undefined && { trackInventory: dto.trackInventory }),
        ...(dto.allowBackorder !== undefined && { allowBackorder: dto.allowBackorder }),
        ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
        ...(dto.isCustomizable !== undefined && { isCustomizable: dto.isCustomizable }),
      },
    });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'PRODUCT_UPDATED',
      resource: 'products',
      resourceId: id,
      before: { name: existing.name, status: existing.status },
      after: { name: updated.name, status: updated.status },
    });

    return updated;
  }

  // ── Admin: Status transitions ──────────────────────────────────

  async publish(id: string, adminId: string): Promise<Product> {
    const product = await this.setStatus(id, ProductStatus.ACTIVE, adminId, 'PRODUCT_PUBLISHED');
    await this.prisma.product.update({
      where: { id },
      data: { publishedAt: new Date() },
    });
    return product;
  }

  async hide(id: string, adminId: string): Promise<Product> {
    return this.setStatus(id, ProductStatus.HIDDEN, adminId, 'PRODUCT_HIDDEN');
  }

  async archive(id: string, adminId: string): Promise<Product> {
    const product = await this.setStatus(id, ProductStatus.ARCHIVED, adminId, 'PRODUCT_ARCHIVED');
    await this.prisma.product.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    return product;
  }

  async restore(id: string, adminId: string): Promise<Product> {
    const product = await this.setStatus(id, ProductStatus.ACTIVE, adminId, 'PRODUCT_RESTORED');
    await this.prisma.product.update({
      where: { id },
      data: { archivedAt: null },
    });
    return product;
  }

  // ── Admin: Safe delete ─────────────────────────────────────────

  async softDelete(id: string, adminId: string): Promise<void> {
    const product = await this.findOneOrFail(id);

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: ProductStatus.ARCHIVED },
    });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'PRODUCT_DELETED',
      resource: 'products',
      resourceId: id,
      before: { name: product.name },
    });
  }

  // ── Admin: List all products ───────────────────────────────────

  async findAllAdmin(params: {
    status?: ProductStatus;
    categoryId?: string;
    isFeatured?: boolean;
    skip?: number;
    take?: number;
  }): Promise<{ items: Product[]; total: number }> {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(params.status && { status: params.status }),
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.isFeatured !== undefined && { isFeatured: params.isFeatured }),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
          media: { orderBy: { sortOrder: 'asc' } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  async findOneAdmin(id: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        variants: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        media: { orderBy: { sortOrder: 'asc' } },
        customizationOptions: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found.`);
    return product;
  }

  // ── Admin: Variants ────────────────────────────────────────────

  async addVariant(
    productId: string,
    dto: CreateVariantDto,
    adminId: string,
  ): Promise<ProductVariant> {
    await this.findOneOrFail(productId);

    const variant = await this.prisma.productVariant.create({
      data: {
        productId,
        name: dto.name,
        sku: dto.sku,
        sortOrder: dto.sortOrder ?? 0,
        regularPrice: dto.regularPrice,
        salePrice: dto.salePrice,
        weightKg: dto.weightKg,
        lengthCm: dto.lengthCm,
        widthCm: dto.widthCm,
        heightCm: dto.heightCm,
        stockQty: dto.stockQty ?? 0,
        reservedQty: 0,
        lowStockAt: dto.lowStockAt,
        trackInventory: dto.trackInventory ?? true,
        allowBackorder: dto.allowBackorder ?? false,
        isAvailable: dto.isAvailable ?? true,
      },
    });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'PRODUCT_VARIANT_ADDED',
      resource: 'product_variants',
      resourceId: variant.id,
      after: { productId, name: variant.name },
    });

    return variant;
  }

  async updateVariant(
    variantId: string,
    dto: Partial<CreateVariantDto>,
    adminId: string,
  ): Promise<ProductVariant> {
    const existing = await this.prisma.productVariant.findFirst({
      where: { id: variantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException(`Variant ${variantId} not found.`);

    const updated = await this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.sku !== undefined && { sku: dto.sku }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.regularPrice !== undefined && { regularPrice: dto.regularPrice }),
        ...(dto.salePrice !== undefined && { salePrice: dto.salePrice }),
        ...(dto.weightKg !== undefined && { weightKg: dto.weightKg }),
        ...(dto.lengthCm !== undefined && { lengthCm: dto.lengthCm }),
        ...(dto.widthCm !== undefined && { widthCm: dto.widthCm }),
        ...(dto.heightCm !== undefined && { heightCm: dto.heightCm }),
        ...(dto.lowStockAt !== undefined && { lowStockAt: dto.lowStockAt }),
        ...(dto.trackInventory !== undefined && { trackInventory: dto.trackInventory }),
        ...(dto.allowBackorder !== undefined && { allowBackorder: dto.allowBackorder }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
      },
    });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'PRODUCT_VARIANT_UPDATED',
      resource: 'product_variants',
      resourceId: variantId,
      before: { name: existing.name },
      after: { name: updated.name },
    });

    return updated;
  }

  async deleteVariant(variantId: string, adminId: string): Promise<void> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, deletedAt: null },
    });
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found.`);

    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'PRODUCT_VARIANT_DELETED',
      resource: 'product_variants',
      resourceId: variantId,
      before: { name: variant.name },
    });
  }

  // ── Admin: Media ───────────────────────────────────────────────

  async addMedia(
    productId: string,
    dto: AddMediaDto,
    adminId: string,
  ): Promise<ProductMedia> {
    await this.findOneOrFail(productId);

    // If isMain=true, unset other main flags
    if (dto.isMain) {
      await this.prisma.productMedia.updateMany({
        where: { productId, isMain: true },
        data: { isMain: false },
      });
    }

    const media = await this.prisma.productMedia.create({
      data: {
        productId,
        type: dto.type,
        url: dto.url,
        storageKey: dto.storageKey,
        altText: dto.altText,
        sortOrder: dto.sortOrder ?? 0,
        isMain: dto.isMain ?? false,
      },
    });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'PRODUCT_MEDIA_ADDED',
      resource: 'product_media',
      resourceId: media.id,
      after: { productId, type: media.type, isMain: media.isMain },
    });

    return media;
  }

  async updateMedia(
    mediaId: string,
    dto: Partial<AddMediaDto>,
    adminId: string,
  ): Promise<ProductMedia> {
    const existing = await this.prisma.productMedia.findUnique({ where: { id: mediaId } });
    if (!existing) throw new NotFoundException(`Media ${mediaId} not found.`);

    // If isMain=true, unset other main flags
    if (dto.isMain) {
      await this.prisma.productMedia.updateMany({
        where: { productId: existing.productId, isMain: true, NOT: { id: mediaId } },
        data: { isMain: false },
      });
    }

    const updated = await this.prisma.productMedia.update({
      where: { id: mediaId },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.url && { url: dto.url }),
        ...(dto.storageKey !== undefined && { storageKey: dto.storageKey }),
        ...(dto.altText !== undefined && { altText: dto.altText }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isMain !== undefined && { isMain: dto.isMain }),
      },
    });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'PRODUCT_MEDIA_UPDATED',
      resource: 'product_media',
      resourceId: mediaId,
    });

    return updated;
  }

  async deleteMedia(mediaId: string, adminId: string): Promise<void> {
    const media = await this.prisma.productMedia.findUnique({ where: { id: mediaId } });
    if (!media) throw new NotFoundException(`Media ${mediaId} not found.`);

    await this.prisma.productMedia.delete({ where: { id: mediaId } });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'PRODUCT_MEDIA_DELETED',
      resource: 'product_media',
      resourceId: mediaId,
    });
  }

  // ── Admin: Customization Options ───────────────────────────────

  async addCustomizationOption(
    productId: string,
    dto: AddCustomizationOptionDto,
    adminId: string,
  ): Promise<ProductCustomizationOption> {
    await this.findOneOrFail(productId);

    const option = await this.prisma.productCustomizationOption.create({
      data: {
        productId,
        groupName: dto.groupName,
        optionLabel: dto.optionLabel,
        priceDelta: dto.priceDelta ?? 0,
        sortOrder: dto.sortOrder ?? 0,
        isAvailable: dto.isAvailable ?? true,
      },
    });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'PRODUCT_CUSTOMIZATION_ADDED',
      resource: 'product_customization_options',
      resourceId: option.id,
      after: { productId, groupName: option.groupName, label: option.optionLabel },
    });

    return option;
  }

  async updateCustomizationOption(
    optionId: string,
    dto: Partial<AddCustomizationOptionDto>,
    adminId: string,
  ): Promise<ProductCustomizationOption> {
    const existing = await this.prisma.productCustomizationOption.findUnique({
      where: { id: optionId },
    });
    if (!existing) throw new NotFoundException(`Option ${optionId} not found.`);

    const updated = await this.prisma.productCustomizationOption.update({
      where: { id: optionId },
      data: {
        ...(dto.groupName && { groupName: dto.groupName }),
        ...(dto.optionLabel && { optionLabel: dto.optionLabel }),
        ...(dto.priceDelta !== undefined && { priceDelta: dto.priceDelta }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
      },
    });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'PRODUCT_CUSTOMIZATION_UPDATED',
      resource: 'product_customization_options',
      resourceId: optionId,
    });

    return updated;
  }

  async deleteCustomizationOption(optionId: string, adminId: string): Promise<void> {
    const option = await this.prisma.productCustomizationOption.findUnique({
      where: { id: optionId },
    });
    if (!option) throw new NotFoundException(`Option ${optionId} not found.`);

    await this.prisma.productCustomizationOption.delete({ where: { id: optionId } });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'PRODUCT_CUSTOMIZATION_DELETED',
      resource: 'product_customization_options',
      resourceId: optionId,
    });
  }

  // ── Public: Active products only ───────────────────────────────

  async findAllPublic(params: {
    categoryId?: string;
    isFeatured?: boolean;
    skip?: number;
    take?: number;
  }): Promise<{ items: Product[]; total: number }> {
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      deletedAt: null,
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.isFeatured !== undefined && { isFeatured: params.isFeatured }),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 24,
        orderBy: { publishedAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          media: {
            where: { type: 'IMAGE' },
            orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
            take: 1,
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  async findOneBySlugPublic(slug: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.ACTIVE, deletedAt: null },
      include: {
        category: true,
        variants: {
          where: { deletedAt: null, isAvailable: true },
          orderBy: { sortOrder: 'asc' },
        },
        media: { orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }] },
        customizationOptions: {
          where: { isAvailable: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!product) throw new NotFoundException(`Product "${slug}" not found.`);
    return product;
  }

  // ── Internal helpers ───────────────────────────────────────────

  async findOneOrFail(id: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found.`);
    return product;
  }

  private async setStatus(
    id: string,
    status: ProductStatus,
    adminId: string,
    action: string,
  ): Promise<Product> {
    const existing = await this.findOneOrFail(id);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { status },
    });
    await this.audit.log({
      adminId,
      actorType: 'admin',
      action,
      resource: 'products',
      resourceId: id,
      before: { status: existing.status },
      after: { status },
    });
    return updated;
  }

  private async resolveSlug(
    explicit: string | undefined,
    name: string,
    excludeId?: string,
  ): Promise<string> {
    return uniqueSlug(explicit ?? name, async (s) => {
      const found = await this.prisma.product.findFirst({
        where: { slug: s, ...(excludeId && { NOT: { id: excludeId } }), deletedAt: null },
      });
      return !!found;
    });
  }
}
