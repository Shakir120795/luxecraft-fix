import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Category, CategoryStatus, Prisma } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { uniqueSlug } from '../../common/utils/slug.util';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── Admin: Create ──────────────────────────────────────────────

  async create(dto: CreateCategoryDto, adminId: string): Promise<Category> {
    const slug = await this.resolveSlug(dto.slug, dto.name);

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? CategoryStatus.ACTIVE,
        imageUrl: dto.imageUrl,
        imageAlt: dto.imageAlt,
        seoTitle: dto.seoTitle,
        seoDesc: dto.seoDesc,
      },
    });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'CATEGORY_CREATED',
      resource: 'categories',
      resourceId: category.id,
      after: { name: category.name, slug: category.slug },
    });

    return category;
  }

  // ── Admin: Update ──────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateCategoryDto,
    adminId: string,
  ): Promise<Category> {
    const existing = await this.findOneOrFail(id);

    let slug = existing.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      slug = await this.resolveSlug(dto.slug, dto.slug, id);
    } else if (dto.name && !dto.slug) {
      // Re-slug only if name changed and no explicit slug provided
      slug = await this.resolveSlug(undefined, dto.name, id);
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        slug,
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.status && { status: dto.status }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.imageAlt !== undefined && { imageAlt: dto.imageAlt }),
        ...(dto.seoTitle !== undefined && { seoTitle: dto.seoTitle }),
        ...(dto.seoDesc !== undefined && { seoDesc: dto.seoDesc }),
      },
    });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'CATEGORY_UPDATED',
      resource: 'categories',
      resourceId: id,
      before: { name: existing.name, status: existing.status },
      after: { name: updated.name, status: updated.status },
    });

    return updated;
  }

  // ── Admin: Status transitions ──────────────────────────────────

  async hide(id: string, adminId: string): Promise<Category> {
    return this.setStatus(id, CategoryStatus.HIDDEN, adminId, 'CATEGORY_HIDDEN');
  }

  async archive(id: string, adminId: string): Promise<Category> {
    const cat = await this.setStatus(id, CategoryStatus.ARCHIVED, adminId, 'CATEGORY_ARCHIVED');
    await this.prisma.category.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    return cat;
  }

  async restore(id: string, adminId: string): Promise<Category> {
    const cat = await this.setStatus(id, CategoryStatus.ACTIVE, adminId, 'CATEGORY_RESTORED');
    await this.prisma.category.update({
      where: { id },
      data: { archivedAt: null },
    });
    return cat;
  }

  // ── Admin: Safe delete ─────────────────────────────────────────

  async softDelete(id: string, adminId: string): Promise<void> {
    const cat = await this.findOneOrFail(id);

    // Check for active products — prefer archive over delete
    const productCount = await this.prisma.product.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (productCount > 0) {
      throw new BadRequestException(
        `Category has ${productCount} product(s). Archive it instead of deleting.`,
      );
    }

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), status: CategoryStatus.ARCHIVED },
    });

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'CATEGORY_DELETED',
      resource: 'categories',
      resourceId: id,
      before: { name: cat.name },
    });
  }

  // ── Admin: Reorder ─────────────────────────────────────────────

  async reorder(dto: ReorderCategoriesDto, adminId: string): Promise<void> {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'CATEGORIES_REORDERED',
      resource: 'categories',
      after: { count: dto.items.length },
    });
  }

  // ── Admin: Set image (from upload) ─────────────────────────────

  async setImage(
    id: string,
    imageUrl: string,
    imageKey: string | undefined,
    imageAlt: string | undefined,
    adminId: string,
  ): Promise<Category> {
    await this.findOneOrFail(id);
    const updated = await this.prisma.category.update({
      where: { id },
      data: { imageUrl, imageKey, imageAlt },
    });
    await this.audit.log({
      adminId,
      actorType: 'admin',
      action: 'CATEGORY_IMAGE_UPDATED',
      resource: 'categories',
      resourceId: id,
    });
    return updated;
  }

  // ── Admin: List all (including hidden/archived) ────────────────

  async findAllAdmin(params: {
    status?: CategoryStatus;
    parentId?: string | null;
    skip?: number;
    take?: number;
  }): Promise<{ items: Category[]; total: number }> {
    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
      ...(params.status && { status: params.status }),
      ...(params.parentId !== undefined && { parentId: params.parentId }),
    };
    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 100,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: { children: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } } },
      }),
      this.prisma.category.count({ where }),
    ]);
    return { items, total };
  }

  async findOneAdmin(id: string): Promise<Category> {
    return this.findOneOrFail(id);
  }

  // ── Public: Active categories only ────────────────────────────

  async findAllPublic(): Promise<Category[]> {
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

  async findOneBySlug(slug: string): Promise<Category> {
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

  // ── Internal helpers ───────────────────────────────────────────

  async findOneOrFail(id: string): Promise<Category> {
    const cat = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!cat) throw new NotFoundException(`Category ${id} not found.`);
    return cat;
  }

  private async setStatus(
    id: string,
    status: CategoryStatus,
    adminId: string,
    action: string,
  ): Promise<Category> {
    const existing = await this.findOneOrFail(id);
    const updated = await this.prisma.category.update({
      where: { id },
      data: { status },
    });
    await this.audit.log({
      adminId,
      actorType: 'admin',
      action,
      resource: 'categories',
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
      const found = await this.prisma.category.findFirst({
        where: { slug: s, ...(excludeId && { NOT: { id: excludeId } }), deletedAt: null },
      });
      return !!found;
    });
  }
}
