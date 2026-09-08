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
import { ShippingService } from '../shipping/shipping.service';
import { CurrencyService } from '../currency/currency.service';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly GUEST_CART_TTL_DAYS = 30;

  constructor(private readonly prisma: PrismaService, private readonly shipping: ShippingService, private readonly currency: CurrencyService) {}

  //  Get or create cart 

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
              product: { select: { id: true, name: true, slug: true, sku: true, regularPrice: true, salePrice: true, weightKg: true, taxRate: true, status: true, media: { select: { id: true, url: true, altText: true, isMain: true, sortOrder: true } } } },
              variant: { select: { id: true, name: true, sku: true, regularPrice: true, salePrice: true, weightKg: true, isAvailable: true } },
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
                product: { select: { id: true, name: true, slug: true, regularPrice: true, salePrice: true, status: true, media: { select: { id: true, url: true, altText: true, isMain: true, sortOrder: true } } } },
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
            product: { select: { id: true, name: true, slug: true, regularPrice: true, salePrice: true, status: true, media: { select: { id: true, url: true, altText: true, isMain: true, sortOrder: true } } } },
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
              product: { select: { id: true, name: true, slug: true, sku: true, regularPrice: true, salePrice: true, weightKg: true, taxRate: true, status: true, media: { select: { id: true, url: true, altText: true, isMain: true, sortOrder: true } } } },
              variant: { select: { id: true, name: true, sku: true, regularPrice: true, salePrice: true, weightKg: true, isAvailable: true } },
            },
          },
        },
      });
    }

    return cart;
  }

  private async validateInventoryAvailability(
    productId: string,
    variantId: string | null | undefined,
    requestedQuantity: number,
  ): Promise<void> {
    if (requestedQuantity < 1) {
      throw new BadRequestException('Quantity must be at least 1.');
    }

    if (variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: {
          id: variantId,
          productId,
          deletedAt: null,
        },
      });

      if (!variant) {
        throw new NotFoundException(`Variant ${variantId} not found.`);
      }

      if (!variant.isAvailable) {
        throw new BadRequestException(`Variant ${variantId} is not available.`);
      }

      const availableStock = Math.max(
        0,
        variant.stockQty - variant.reservedQty,
      );

      if (
        variant.trackInventory &&
        !variant.allowBackorder &&
        availableStock < requestedQuantity
      ) {
        if (availableStock <= 0) {
          throw new BadRequestException(
            'This size is out of stock and cannot be added to cart.',
          );
        }

        throw new BadRequestException(
          `Only ${availableStock} item(s) are available for this size.`,
        );
      }

      return;
    }

    // Products without a variant do not have product-level stock fields in the current schema.
    // Inventory is therefore enforced only when a specific size/variant is selected.
  }

  //  Add to cart 

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

    // Check if item already exists in cart (same product + variant)
    // Note: We don't check customization equality here due to JSON comparison limitations.
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
      },
    });

    const requestedQuantity =
      (existingItem?.quantity ?? 0) + dto.quantity;

    // Validate stock for the full quantity that will be in the cart.
    await this.validateInventoryAvailability(
      dto.productId,
      dto.variantId,
      requestedQuantity,
    );

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: requestedQuantity },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
              regularPrice: true,
              salePrice: true,
              weightKg: true,
              status: true,
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              sku: true,
              regularPrice: true,
              salePrice: true,
              weightKg: true,
              isAvailable: true,
              stockQty: true,
              reservedQty: true,
              trackInventory: true,
              allowBackorder: true,
            },
          },
        },
      });
    }

    // Calculate price snapshot (variant price overrides product price)
    let priceSnapshot = product.salePrice ?? product.regularPrice;

    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.variantId },
      });

      if (variant?.regularPrice != null) {
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
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            regularPrice: true,
            salePrice: true,
            weightKg: true,
            status: true,
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            sku: true,
            regularPrice: true,
            salePrice: true,
            weightKg: true,
            isAvailable: true,
            stockQty: true,
            reservedQty: true,
            trackInventory: true,
            allowBackorder: true,
          },
        },
      },
    });
  }

  //  Update cart item 

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

    if (dto.quantity !== undefined) {
      await this.validateInventoryAvailability(
        item.productId,
        item.variantId,
        dto.quantity,
      );
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
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            regularPrice: true,
            salePrice: true,
            weightKg: true,
            status: true,
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            sku: true,
            regularPrice: true,
            salePrice: true,
            weightKg: true,
            isAvailable: true,
            stockQty: true,
            reservedQty: true,
            trackInventory: true,
            allowBackorder: true,
          },
        },
      },
    });
  }

  //  Remove cart item 

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

  //  Clear cart 

  async clearCart(userId?: string, sessionId?: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId, sessionId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  //  Get cart 

  async getCart(
    userId?: string,
    sessionId?: string,
    country?: string,
  ): Promise<Cart & { items: (CartItem & { displayPrice: number })[] }> {
    const cart = await this.getOrCreateCart(userId, sessionId);
    const customerCurrency = country ? this.currency.getCurrencyForCountry(country) : cart.currency.toUpperCase();
    const rate = await this.currency.getRate(cart.currency.toUpperCase(), customerCurrency);
    return {
      ...cart,
      items: cart.items.map((item) => ({
        ...item,
        displayPrice: Math.round(Number(item.priceSnapshot) * rate * 100) / 100,
      })),
    };
  }

  //  Merge guest cart into customer cart on login 

  async mergeGuestCartIntoCustomerCart(
    userId: string,
    guestSessionId: string,
  ): Promise<Cart & { items: CartItem[] }> {
    const guestCart = await this.prisma.cart.findFirst({
      where: { sessionId: guestSessionId },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getOrCreateCart(userId);
    }

    const customerCart = await this.getOrCreateCart(userId);

    for (const guestItem of guestCart.items) {
      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId: customerCart.id,
          productId: guestItem.productId,
          variantId: guestItem.variantId,
        },
      });

      const requestedQuantity =
        (existingItem?.quantity ?? 0) + guestItem.quantity;

      await this.validateInventoryAvailability(
        guestItem.productId,
        guestItem.variantId,
        requestedQuantity,
      );

      if (existingItem) {
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: requestedQuantity },
        });
      } else {
        await this.prisma.cartItem.update({
          where: { id: guestItem.id },
          data: { cartId: customerCart.id },
        });
      }
    }

    await this.prisma.cart.delete({ where: { id: guestCart.id } });

    return this.getOrCreateCart(userId);
  }

  //  Calculate cart totals 

  async validateCoupon(code: string, subtotal: number, productIds: string[]): Promise<{
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    subtotal: number;
  }> {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) throw new BadRequestException('Coupon code is required.');

    const coupon = await this.prisma.coupon.findUnique({ where: { code: normalizedCode } });
    if (!coupon || !coupon.isActive) throw new BadRequestException('Invalid or inactive coupon code.');

    const now = new Date();
    if (coupon.validFrom > now || (coupon.validTo && coupon.validTo < now)) {
      throw new BadRequestException('This coupon is not currently valid.');
    }

    if (coupon.maxUsageCount != null && coupon.usedCount >= coupon.maxUsageCount) {
      throw new BadRequestException('This coupon has reached its usage limit.');
    }

    const orderSubtotal = Math.max(0, Number(subtotal) || 0);
    if (coupon.minOrderAmount != null && orderSubtotal < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(`Minimum order amount for this coupon is $${Number(coupon.minOrderAmount).toFixed(2)}.`);
    }

    const allowedProducts = Array.isArray(coupon.applicableProducts) ? coupon.applicableProducts : [];
    const allowedCategories = Array.isArray(coupon.applicableCategories) ? coupon.applicableCategories : [];

    if (allowedProducts.length > 0 || allowedCategories.length > 0) {
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds }, deletedAt: null },
        select: { id: true, categoryId: true },
      });

      const matchesProduct = allowedProducts.some((id) => products.some((product) => product.id === id));
      const matchesCategory = allowedCategories.some((id) => products.some((product) => product.categoryId === id));

      if (!matchesProduct && !matchesCategory) {
        throw new BadRequestException('This coupon does not apply to the items in your cart.');
      }
    }

    let discountAmount = String(coupon.discountType).toUpperCase() === 'FIXED'
      ? Number(coupon.discountValue)
      : (orderSubtotal * Number(coupon.discountValue)) / 100;

    discountAmount = Math.min(Math.max(0, discountAmount), orderSubtotal);

    return {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discountAmount: Number(discountAmount.toFixed(2)),
      subtotal: orderSubtotal,
    };
  }
  async calculateCartTotals(
    userId?: string,
    sessionId?: string,
    country?: string,
  ): Promise<{
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    itemCount: number;
    currency: string;
  }> {
    const cart = await this.getOrCreateCart(userId, sessionId);
    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: { select: { weightKg: true, taxRate: true } },
        variant: { select: { weightKg: true } },
      },
    });

    const baseCurrency = cart.currency.toUpperCase();
    const customerCurrency = country
      ? this.currency.getCurrencyForCountry(country)
      : baseCurrency;

    let subtotal = 0;
    let itemCount = 0;
    let tax = 0;
    let totalWeightKg = 0;

    for (const item of items) {
      const itemPrice = Number(item.priceSnapshot);
      const quantity = Number(item.quantity);
      const lineTotal = itemPrice * quantity;

      subtotal += lineTotal;
      itemCount += quantity;

      const taxRate = Number(item.product.taxRate ?? 0);
      tax += (lineTotal * taxRate) / 100;

      const itemWeight =
        item.variant?.weightKg != null
          ? Number(item.variant.weightKg)
          : Number(item.product.weightKg ?? 0);

      totalWeightKg += Math.max(0, itemWeight) * quantity;
    }

    const rate = await this.currency.getRate(baseCurrency, customerCurrency);
    subtotal = Math.round(subtotal * rate * 100) / 100;
    tax = Math.round(tax * rate * 100) / 100;

    let shipping = 0;

    if (country && country.length === 2 && itemCount > 0) {
      const shippingMethods = await this.shipping.calculateShippingRate({
        country: country.toUpperCase(),
        cartWeightKg: totalWeightKg,
        cartTotal: subtotal,
      });

      if (shippingMethods.length > 0) {
        shipping = Math.min(...shippingMethods.map((method) => method.calculatedRate));
      }
    }

    return {
      subtotal,
      shipping,
      tax,
      total: Math.round((subtotal + shipping + tax) * 100) / 100,
      itemCount,
      currency: customerCurrency,
    };
  }

}





