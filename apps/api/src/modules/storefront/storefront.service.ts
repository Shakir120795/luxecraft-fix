import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Category, Product, ProductStatus, CategoryStatus } from '@prisma/client';

@Injectable()
export class StorefrontService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Categories ─────────────────────────────────────────────────

  async getCategories(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { status: CategoryStatus.ACTIVE, deletedAt: null, parentId: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        children: {
          where: { status: CategoryStatus.ACTIVE, deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const cat = await this.prisma.category.findFirst({
      where: { slug, status: CategoryStatus.ACTIVE, deletedAt: null },
      include: {
        children: {
          where: { status: CategoryStatus.ACTIVE, deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
    if (!cat) throw new NotFoundException(`Category "${slug}" not found.`);
    return cat;
  }

  // ── Products ───────────────────────────────────────────────────

  async getProducts(params: {
    categoryId?: string;
    isFeatured?: boolean;
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<{ items: Product[]; total: number }> {
    const where: Record<string, unknown> = {
      status: ProductStatus.ACTIVE,
      deletedAt: null,
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.isFeatured !== undefined && { isFeatured: params.isFeatured }),
      ...(params.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
          { sku: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
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

  async getProductBySlug(slug: string): Promise<Product> {
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

  // ── Featured products ──────────────────────────────────────────

  async getFeaturedProducts(take = 8): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE, deletedAt: null, isFeatured: true },
      take,
      orderBy: { publishedAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        media: {
          where: { type: 'IMAGE' },
          orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
        },
      },
    });
  }
}
