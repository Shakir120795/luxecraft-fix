import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cart, CartItem, Prisma } from '@prisma/client';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly GUEST_CART_TTL_DAYS = 30;

  constructor(private readonly prisma: PrismaService) {}

  // ── Get or create cart ─────────────────────────────────────────

  async getOrCreateCart(
    userId?: string,
    sessionId?: string,
  ): Promise<Cart & { items: CartItem[] }> {
    if (!userId && !sessionId) {
      throw new BadRequestException('Either userId or sessionId is required.');
    }

    // Customer cart
    if (userId) {
      let cart = await this.prisma.cart.findFirst({
        where: { userId },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, slug: true, regularPrice: true, salePrice: true, status: true } },
              variant: { select: { id: true, name: true, regularPrice: true, salePrice: true, isAvailable: true } },
            },
          },
        },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId },
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, slug: true, regularPrice: true, salePrice: true, status: true } },
                variant: { select: { id: true, name: true, regularPrice: true, salePrice: true, isAvailable: true } },
              },
            },
          },
        });
      }

      return cart;
    }

    // Guest cart
    let cart = await this.prisma.cart.findFirst({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, regularPrice: true, salePrice: true, status: true } },
            variant: { select: { id: true, name: true, regularPrice: true, salePrice: true, isAvailable: true } },
          },
        },
      },
    });

    if (!cart) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.GUEST_CART_TTL_DAYS);

      cart = await this.prisma.cart.create({
        data: { sessionId, expiresAt },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, slug: true, regularPrice: true, salePrice: true, status: true } },
              variant: { select: { id: true, name: true, regularPrice: true, salePrice: true, isAvailable: true } },
            },
          },
        },
      });
    }

    return cart;
  }

  // ── Add to cart ────────────────────────────────────────────────

  async addToCart(
    dto: AddToCartDto,
    userId?: string,
    sessionId?: string,
  ): Promise<CartItem> {
    const cart = await this.getOrCreateCart(userId, sessionId);

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
        where: { id: dto.variantId, productId: dto.productId, deletedAt: null },
      });
      if (!variant) {
        throw new NotFoundException(`Variant ${dto.variantId} not found.`);
      }
      if (!variant.isAvailable) {
        throw new BadRequestException(`Variant ${dto.variantId} is not available.`);
      }
    }

    // Check if item already exists in cart (same product + variant)
    // Note: We don't check customization equality here due to JSON comparison limitations
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
      },
    });

    if (existingItem) {
      // Update quantity if product+variant match (ignoring customization differences)
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: dto.quantity } },
        include: {
          product: { select: { id: true, name: true, slug: true, regularPrice: true, salePrice: true, status: true } },
          variant: { select: { id: true, name: true, regularPrice: true, salePrice: true, isAvailable: true } },
        },
      });
    }

    // Calculate price snapshot (variant price overrides product price)
    let priceSnapshot = product.salePrice ?? product.regularPrice;
    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.variantId },
      });
      if (variant && variant.regularPrice) {
        priceSnapshot = variant.salePrice ?? variant.regularPrice;
      }
    }

    // Create new cart item
    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity,
        customization: dto.customization as Prisma.InputJsonValue,
        priceSnapshot,
      },
      include: {
        product: { select: { id: true, name: true, slug: true, regularPrice: true, salePrice: true, status: true } },
        variant: { select: { id: true, name: true, regularPrice: true, salePrice: true, isAvailable: true } },
      },
    });
  }

  // ── Update cart item ───────────────────────────────────────────

  async updateCartItem(
    itemId: string,
    dto: UpdateCartItemDto,
    userId?: string,
    sessionId?: string,
  ): Promise<CartItem> {
    const cart = await this.getOrCreateCart(userId, sessionId);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException(`Cart item ${itemId} not found.`);
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.customization !== undefined && {
          customization: dto.customization as Prisma.InputJsonValue,
        }),
      },
      include: {
        product: { select: { id: true, name: true, slug: true, regularPrice: true, salePrice: true, status: true } },
        variant: { select: { id: true, name: true, regularPrice: true, salePrice: true, isAvailable: true } },
      },
    });
  }

  // ── Remove cart item ───────────────────────────────────────────

  async removeCartItem(
    itemId: string,
    userId?: string,
    sessionId?: string,
  ): Promise<void> {
    const cart = await this.getOrCreateCart(userId, sessionId);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException(`Cart item ${itemId} not found.`);
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  // ── Clear cart ─────────────────────────────────────────────────

  async clearCart(userId?: string, sessionId?: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId, sessionId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  // ── Get cart ───────────────────────────────────────────────────

  async getCart(
    userId?: string,
    sessionId?: string,
  ): Promise<Cart & { items: CartItem[] }> {
    return this.getOrCreateCart(userId, sessionId);
  }

  // ── Merge guest cart into customer cart on login ───────────────

  async mergeGuestCartIntoCustomerCart(
    userId: string,
    guestSessionId: string,
  ): Promise<Cart & { items: CartItem[] }> {
    const guestCart = await this.prisma.cart.findFirst({
      where: { sessionId: guestSessionId },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      // No guest cart or empty — just return customer cart
      return this.getOrCreateCart(userId);
    }

    const customerCart = await this.getOrCreateCart(userId);

    // Merge items: for each guest item, check if exists in customer cart
    for (const guestItem of guestCart.items) {
      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId: customerCart.id,
          productId: guestItem.productId,
          variantId: guestItem.variantId,
        },
      });

      if (existingItem) {
        // Increment quantity
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: { increment: guestItem.quantity } },
        });
      } else {
        // Move guest item to customer cart
        await this.prisma.cartItem.update({
          where: { id: guestItem.id },
          data: { cartId: customerCart.id },
        });
      }
    }

    // Delete guest cart
    await this.prisma.cart.delete({ where: { id: guestCart.id } });

    return this.getOrCreateCart(userId);
  }

  // ── Calculate cart totals ──────────────────────────────────────

  async calculateCartTotals(userId?: string, sessionId?: string): Promise<{
    subtotal: number;
    itemCount: number;
    currency: string;
  }> {
    const cart = await this.getOrCreateCart(userId, sessionId);

    let subtotal = 0;
    let itemCount = 0;

    for (const item of cart.items) {
      const itemPrice = Number(item.priceSnapshot);
      subtotal += itemPrice * item.quantity;
      itemCount += item.quantity;
    }

    return {
      subtotal,
      itemCount,
      currency: cart.currency,
    };
  }
}
