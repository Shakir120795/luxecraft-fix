import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminCmsService {
  private readonly logger = new Logger(AdminCmsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCmsContent(): Promise<any> {
    return { message: 'CMS content management ready for Phase 7 extension' };
  }

  async getHero() {
    return this.prisma.heroSection.findFirst({
      orderBy: { updatedAt: 'desc' },
      include: {
        product: {
          include: {
            media: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
  }

  async updateHero(data: {
    productId?: string | null;
    imageUrl?: string | null;
    eyebrow?: string | null;
    title: string;
    subtitle?: string | null;
    primaryCtaText?: string | null;
    primaryCtaLink?: string | null;
    secondaryCtaText?: string | null;
    secondaryCtaLink?: string | null;
    isActive?: boolean;
  }) {
    const existing = await this.prisma.heroSection.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    const payload = {
      productId: data.productId ?? null,
      imageUrl: data.imageUrl ?? null,
      eyebrow: data.eyebrow ?? null,
      title: data.title,
      subtitle: data.subtitle ?? null,
      primaryCtaText: data.primaryCtaText ?? null,
      primaryCtaLink: data.primaryCtaLink ?? null,
      secondaryCtaText: data.secondaryCtaText ?? null,
      secondaryCtaLink: data.secondaryCtaLink ?? null,
      isActive: data.isActive ?? true,
    };

    if (existing) {
      return this.prisma.heroSection.update({
        where: { id: existing.id },
        data: payload,
        include: {
          product: {
            include: {
              media: {
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      });
    }

    return this.prisma.heroSection.create({
      data: payload,
      include: {
        product: {
          include: {
            media: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
  }
}
