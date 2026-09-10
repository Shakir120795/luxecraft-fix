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
        hero2Product: true,
        hero3Product: true,
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
    hero2ProductId?: string | null;
    hero2ImageUrl?: string | null;
    hero2Title?: string | null;
    hero2Link?: string | null;
    hero3ProductId?: string | null;
    hero3ImageUrl?: string | null;
    hero3Title?: string | null;
    hero3Link?: string | null;
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
      hero2ProductId: data.hero2ProductId ?? null,
      hero2ImageUrl: data.hero2ImageUrl ?? null,
      hero2Title: data.hero2Title ?? null,
      hero2Link: data.hero2Link ?? null,
      hero3ProductId: data.hero3ProductId ?? null,
      hero3ImageUrl: data.hero3ImageUrl ?? null,
      hero3Title: data.hero3Title ?? null,
      hero3Link: data.hero3Link ?? null,
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
          hero2Product: true,
          hero3Product: true,
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
        hero2Product: true,
        hero3Product: true,
      },
    });
  }
}
