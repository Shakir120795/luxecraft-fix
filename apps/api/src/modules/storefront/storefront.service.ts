import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  Category,
  Product,
  ProductStatus,
  CategoryStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class StorefrontService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async getProductFilters() {
    return this.settings.getProductFilters();
  }

  async getHomepageVideos() {
    return this.settings.getHomepageVideos();
  }

  async getHero() {
    const hero = await this.prisma.heroSection.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        product: {
          where: { status: ProductStatus.ACTIVE, deletedAt: null },
          include: {
            media: {
              where: { type: 'IMAGE' },
              orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
            },
          },
        },
      },
    });

    return hero;
  }

  async getCategories(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        status: CategoryStatus.ACTIVE,
        deletedAt: null,
        parentId: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        children: {
          where: {
            status: CategoryStatus.ACTIVE,
            deletedAt: null,
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const cat = await this.prisma.category.findFirst({
      where: {
        slug,
        status: CategoryStatus.ACTIVE,
        deletedAt: null,
      },
      include: {
        children: {
          where: {
            status: CategoryStatus.ACTIVE,
            deletedAt: null,
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });

    if (!cat) {
      throw new NotFoundException(`Category "${slug}" not found.`);
    }

    return cat;
  }

  async getProducts(params: {
    categoryId?: string;
    isFeatured?: boolean;
    search?: string;
    skip?: number;
    take?: number;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'featured' | 'newest' | 'price-low' | 'price-high';
    filters?: Record<string, string>;
  }): Promise<{ items: Product[]; total: number }> {
    const filterEntries = Object.entries(params.filters ?? {}).filter(
      ([, value]) => Boolean(value),
    );

    const andConditions: Prisma.ProductWhereInput[] = [];

    if (params.search) {
      andConditions.push({
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
          { sku: { contains: params.search, mode: 'insensitive' } },
        ],
      });
    }

    for (const [slug, value] of filterEntries) {
      const normalizedValue = value.trim().toLowerCase();
      const displayValue = normalizedValue.replace(/-/g, ' ');

      const jsonCondition: Prisma.ProductWhereInput = {
        filterData: {
          path: [slug],
          array_contains: [normalizedValue],
        },
      };

      const fallbackConditions: Prisma.ProductWhereInput[] = [jsonCondition];

      if (slug === 'style') {
        fallbackConditions.push({
          style: {
            contains: displayValue,
            mode: 'insensitive',
          },
        });
      }

      if (slug === 'material') {
        fallbackConditions.push({
          material: {
            contains: displayValue,
            mode: 'insensitive',
          },
        });
      }

      if (slug === 'color') {
        fallbackConditions.push({
          color: {
            contains: displayValue,
            mode: 'insensitive',
          },
        });
      }

      if (slug === 'collection') {
        fallbackConditions.push({
          collection: {
            contains: displayValue,
            mode: 'insensitive',
          },
        });
      }

      if (slug === 'size') {
        const sizeWithSpaces = normalizedValue.replace(
          /^(\d+)x(\d+)$/,
          '$1 x $2',
        );
        const sizeCandidates = Array.from(
          new Set([
            displayValue,
            sizeWithSpaces,
            sizeWithSpaces + ' ft',
          ]),
        );

        for (const candidate of sizeCandidates) {
          fallbackConditions.push({
            variants: {
              some: {
                deletedAt: null,
                name: {
                  contains: candidate,
                  mode: 'insensitive',
                },
              },
            },
          });
        }
      }

      if (slug === 'weave-type' || slug === 'shape') {
        fallbackConditions.push({
          category: {
            name: {
              contains: displayValue,
              mode: 'insensitive',
            },
          },
        });
      }

      andConditions.push(
        fallbackConditions.length === 1
          ? fallbackConditions[0]
          : { OR: fallbackConditions },
      );
    }

    if (Number.isFinite(params.minPrice) || Number.isFinite(params.maxPrice)) {
      const minPrice = Number.isFinite(params.minPrice) ? params.minPrice : undefined;
      const maxPrice = Number.isFinite(params.maxPrice) ? params.maxPrice : undefined;
      andConditions.push({
        OR: [
          {
            salePrice: {
              not: null,
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            },
          },
          {
            salePrice: null,
            regularPrice: {
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            },
          },
        ],
      });
    }

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      deletedAt: null,
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.isFeatured !== undefined && {
        isFeatured: params.isFeatured,
      }),
      ...(andConditions.length > 0 && { AND: andConditions }),
    };

    const take = Math.min(Math.max(params.take ?? 12, 1), 48);
    const skip = Math.max(params.skip ?? 0, 0);

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      params.sort === 'price-low'
        ? [{ salePrice: 'asc' }, { regularPrice: 'asc' }, { publishedAt: 'desc' }]
        : params.sort === 'price-high'
          ? [{ salePrice: 'desc' }, { regularPrice: 'desc' }, { publishedAt: 'desc' }]
          : params.sort === 'newest'
            ? [{ createdAt: 'desc' }]
            : [{ publishedAt: 'desc' }];

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
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

  async getSitemapData(): Promise<{
    products: Array<{ slug: string; updatedAt: Date; publishedAt: Date | null }>;
    categories: Array<{ slug: string; updatedAt: Date }>;
  }> {
    const [products, categories] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          status: ProductStatus.ACTIVE,
          deletedAt: null,
        },
        select: {
          slug: true,
          updatedAt: true,
          publishedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.category.findMany({
        where: {
          status: CategoryStatus.ACTIVE,
          deletedAt: null,
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return { products, categories };
  }

  async getProductBySlug(slug: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        status: ProductStatus.ACTIVE,
        deletedAt: null,
      },
      include: {
        category: true,
        variants: {
          where: {
            deletedAt: null,
            isAvailable: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        media: {
          orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
        },
        customizationOptions: {
          where: { isAvailable: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product "${slug}" not found.`);
    }

    return product;
  }

  async getFeaturedProducts(take = 8): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        deletedAt: null,
        isFeatured: true,
      },
      take,
      orderBy: { publishedAt: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        media: {
          where: { type: 'IMAGE' },
          orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
        },
      },
    });
  }
}

