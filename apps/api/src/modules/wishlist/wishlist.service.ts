import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Wishlist, WishlistItem } from '@prisma/client';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { MoveToCartDto } from './dto/move-to-cart.dto';
import { CartService } from '../cart/cart.service';

@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  // ── Get or create wishlist ─────────────────────────────────────

  async getOrCreateWishlist(userId: string): Promise<Wishlist & { items: WishlistItem[] }> {
    let wishlist = await this.prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                regularPrice: true,
                salePrice: true,
                status: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                regularPrice: true,
                salePrice: true,
                isAvailable: true,
              },
            },
          },
        },
      },
    });

    if (!wishlist) {
      wishlist = await this.prisma.wishlist.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  regularPrice: true,
                  salePrice: true,
                  status: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  regularPrice: true,
                  salePrice: true,
                  isAvailable: true,
                },
              },
            },
          },
        },
      });
    }

    return wishlist;
  }

  // ── Add to wishlist ────────────────────────────────────────────

  async addToWishlist(dto: AddToWishlistDto, userId: string): Promise<WishlistItem> {
    const wishlist = await this.getOrCreateWishlist(userId);

    // Validate product exists and is active
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, deletedAt: null, status: 'ACTIVE' },
    });
    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found or unavailable.`);
    }

    // Validate variant if provided
    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: {
          id: dto.variantId,
          productId: dto.productId,
          deletedAt: null,
        },
      });
      if (!variant) {
        throw new NotFoundException(`Variant ${dto.variantId} not found.`);
      }
    }

    // Check if already in wishlist (unique constraint handles this, but we check for better error message)
    const existing = await this.prisma.wishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
      },
    });

    if (existing) {
      throw new BadRequestException('Item already in wishlist.');
    }

    // Add to wishlist
    return this.prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: dto.productId,
        variantId: dto.variantId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            regularPrice: true,
            salePrice: true,
            status: true,
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            regularPrice: true,
            salePrice: true,
            isAvailable: true,
          },
        },
      },
    });
  }

  // ── Remove from wishlist ───────────────────────────────────────

  async removeFromWishlist(itemId: string, userId: string): Promise<void> {
    const wishlist = await this.getOrCreateWishlist(userId);

    const item = await this.prisma.wishlistItem.findFirst({
      where: { id: itemId, wishlistId: wishlist.id },
    });

    if (!item) {
      throw new NotFoundException(`Wishlist item ${itemId} not found.`);
    }

    await this.prisma.wishlistItem.delete({ where: { id: itemId } });
  }

  // ── Toggle wishlist (add if not present, remove if present) ────

  async toggleWishlist(dto: AddToWishlistDto, userId: string): Promise<{
    action: 'added' | 'removed';
    item?: WishlistItem;
  }> {
    const wishlist = await this.getOrCreateWishlist(userId);

    const existing = await this.prisma.wishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
      },
    });

    if (existing) {
      await this.prisma.wishlistItem.delete({ where: { id: existing.id } });
      return { action: 'removed' };
    }

    const item = await this.addToWishlist(dto, userId);
    return { action: 'added', item };
  }

  // ── Get wishlist ───────────────────────────────────────────────

  async getWishlist(userId: string): Promise<Wishlist & { items: WishlistItem[] }> {
    return this.getOrCreateWishlist(userId);
  }

  // ── Clear wishlist ─────────────────────────────────────────────

  async clearWishlist(userId: string): Promise<void> {
    const wishlist = await this.getOrCreateWishlist(userId);
    await this.prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } });
  }

  // ── Move wishlist item to cart ─────────────────────────────────

  async moveToCart(dto: MoveToCartDto, userId: string, sessionId?: string): Promise<void> {
    const wishlist = await this.getOrCreateWishlist(userId);

    const item = await this.prisma.wishlistItem.findFirst({
      where: { id: dto.wishlistItemId, wishlistId: wishlist.id },
      include: { product: true, variant: true },
    });

    if (!item) {
      throw new NotFoundException(`Wishlist item ${dto.wishlistItemId} not found.`);
    }

    // Add to cart
    await this.cartService.addToCart(
      {
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        quantity: dto.quantity,
        customization: dto.customization,
      },
      userId,
      sessionId,
    );

    // Remove from wishlist
    await this.prisma.wishlistItem.delete({ where: { id: dto.wishlistItemId } });
  }

  // ── Check if product is in wishlist ────────────────────────────

  async isInWishlist(
    productId: string,
    variantId: string | undefined,
    userId: string,
  ): Promise<boolean> {
    const wishlist = await this.getOrCreateWishlist(userId);

    const item = await this.prisma.wishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId,
        variantId: variantId ?? null,
      },
    });

    return !!item;
  }
}
