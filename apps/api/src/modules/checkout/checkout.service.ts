import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { CartService } from '../cart/cart.service';
import { AddressesService } from '../addresses/addresses.service';
import { ShippingService } from '../shipping/shipping.service';
import { TaxService } from '../tax/tax.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutOrderDto, GuestCheckoutAddressDto } from './dto/create-checkout-order.dto';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly cart: CartService,
    private readonly addresses: AddressesService,
    private readonly shipping: ShippingService,
    private readonly tax: TaxService,
    private readonly orders: OrdersService,
    private readonly payments: PaymentsService,
    private readonly inventory: InventoryService,
    private readonly prisma: PrismaService,
  ) {}

  async initiateCheckout(userId?: string, sessionId?: string): Promise<any> {
    const cart = await this.cart.getCart(userId, sessionId);
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty.');
    }

    const totals = await this.cart.calculateCartTotals(userId, sessionId);

    return {
      cart,
      totals,
      cartTotal: totals.subtotal,
      currency: cart.currency,
      nextStep: userId ? 'select_address' : 'guest_email',
    };
  }

  async calculateCheckoutTotals(data: {
    subtotal: number;
    shippingCost: number;
    country: string;
    stateProvince?: string;
    currency: string;
  }): Promise<any> {
    const taxableAmount = data.subtotal + data.shippingCost;
    const taxCalc = await this.tax.calculateTax({
      country: data.country,
      stateProvince: data.stateProvince,
      amount: taxableAmount,
    });

    const total = taxCalc.isInclusive
      ? taxableAmount
      : taxableAmount + taxCalc.taxAmount;

    return {
      subtotal: data.subtotal,
      shippingCost: data.shippingCost,
      taxAmount: taxCalc.taxAmount,
      taxRate: taxCalc.taxRate,
      total,
      currency: data.currency,
    };
  }

  /**
   * The only customer-facing standard-order entry point. Prices, weight,
   * shipping and tax are recalculated from database-backed cart data here;
   * browser values are never accepted as the source of truth.
   */
  async createStandardOrder(input: {
    userId?: string;
    sessionId?: string;
    dto: CreateCheckoutOrderDto;
  }): Promise<any> {
    const cart = await this.cart.getCart(input.userId, input.sessionId);
    if (cart.items.length === 0) throw new BadRequestException('Cart is empty.');

    const persistedItems = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: { select: { id: true, name: true, slug: true, sku: true, regularPrice: true, salePrice: true, weightKg: true, taxRate: true } },
        variant: { select: { id: true, name: true, sku: true, regularPrice: true, salePrice: true, weightKg: true, trackInventory: true, stockQty: true, reservedQty: true, allowBackorder: true } },
      },
    });

    // 1. Validate stock availability BEFORE reserving
    for (const item of persistedItems) {
      if (item.variant?.trackInventory) {
        const available = item.variant.stockQty - item.variant.reservedQty;
        if (available < item.quantity && !item.variant.allowBackorder) {
          throw new BadRequestException(
            `Insufficient stock for ${item.product.name}${item.variant.name ? ` - ${item.variant.name}` : ''}. Available: ${available}, requested: ${item.quantity}`
          );
        }
      }
    }

    const shippingAddress = await this.resolveShippingAddress(input.userId, input.dto);
    const billingAddress = await this.resolveBillingAddress(input.userId, input.dto, shippingAddress);
    const country = shippingAddress.country.toUpperCase();
    const cartItems = persistedItems.map((item) => {
      const unitPrice = Number(
        item.variant?.salePrice ?? item.variant?.regularPrice ?? item.product.salePrice ?? item.product.regularPrice,
      );
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        throw new BadRequestException(`Product ${item.productId} has an invalid price.`);
      }
      return { ...item, priceSnapshot: unitPrice };
    });

    const subtotal = cartItems.reduce((sum, item) => sum + Number(item.priceSnapshot) * item.quantity, 0);
    const cartWeightKg = cartItems.reduce(
      (sum, item) => sum + Number(item.variant?.weightKg ?? item.product.weightKg ?? 0) * item.quantity,
      0,
    );
    const methods = await this.shipping.calculateShippingRate({ country, cartWeightKg, cartTotal: subtotal });
    if (methods.length === 0) {
      throw new BadRequestException('Shipping method is unavailable for this address.');
    }

    const requestedShippingMethodId = input.dto.shippingMethodId?.trim();
    if (!requestedShippingMethodId) {
      throw new BadRequestException('shippingMethodId is required.');
    }

    // The selected method must be one of the methods currently available
    // for this address and cart. Never silently fall back to the first method.
    const shippingMethod = methods.find((method) => method.id === requestedShippingMethodId);
    if (!shippingMethod) {
      throw new BadRequestException('The selected shipping method is unavailable for this address.');
    }

    // Validate any coupon against the authoritative server-side cart values.
    // The browser never supplies a trusted discount amount.
    let discountAmount = 0;
    if (input.dto.couponCode?.trim()) {
      const coupon = await this.cart.validateCoupon(
        input.dto.couponCode,
        subtotal,
        cartItems.map((item) => item.productId),
        cart.currency,
      );
      discountAmount = coupon.discountAmount;
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    // Tax is determined exclusively by the active country/state TaxRule.
    // This is the same tax source used by checkout totals calculation.
    const taxableAmount = discountedSubtotal + shippingMethod.calculatedRate;
    const taxCalc = await this.tax.calculateTax({
      country,
      stateProvince: shippingAddress.stateProvince ?? undefined,
      amount: taxableAmount,
    });
    const taxAmount = taxCalc.taxAmount;
    const total = taxCalc.isInclusive
      ? taxableAmount
      : taxableAmount + taxAmount;

    // 2. Reserve inventory stock. The reservation itself uses an atomic
    // conditional UPDATE so the pre-check above can never be the final
    // authority under concurrent checkout requests.
    const reservedItems: { variantId: string; quantity: number }[] = [];

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const item of cartItems) {
          if (item.variantId && item.variant?.trackInventory) {
            const reserved = await tx.$queryRaw<
              Array<{ id: string; productId: string; stockQty: number; reservedQty: number }>
            >`
              UPDATE "product_variants"
              SET "reservedQty" = "reservedQty" + ${item.quantity},
                  "updatedAt" = CURRENT_TIMESTAMP
              WHERE "id" = ${item.variantId}
                AND "deletedAt" IS NULL
                AND "trackInventory" = TRUE
                AND (
                  "allowBackorder" = TRUE
                  OR "stockQty" - "reservedQty" >= ${item.quantity}
                )
              RETURNING "id", "productId", "stockQty", "reservedQty"
            `;

            if (reserved.length === 0) {
              throw new BadRequestException(
                `Insufficient stock for ${item.product.name}${item.variant.name ? ` - ${item.variant.name}` : ''}. Another checkout may have reserved the remaining inventory. Please try again.`,
              );
            }

            const updated = reserved[0];

            // Log reservation after the atomic update succeeds.
            await tx.inventoryLog.create({
              data: {
                productId: updated.productId,
                variantId: updated.id,
                changeType: 'ORDER_RESERVE',
                delta: -item.quantity,
                qtyBefore: updated.stockQty,
                qtyAfter: updated.stockQty,
                reason: 'Checkout - Stock reserved',
                reference: cart.id,
              },
            });

            reservedItems.push({
              variantId: updated.id,
              quantity: item.quantity,
            });

            this.logger.log(`Reserved ${item.quantity} units of variant ${updated.id}`);
          }
        }
      });
    } catch (error) {
      this.logger.error(
        `Failed to reserve inventory: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to reserve inventory. Please try again.');
    }

    // 3. Create order with reserved stock
    let order, payment, clientSecret, approveUrl, publicKey;

    try {
      order = await this.orders.create({
        userId: input.userId,
        guestEmail: input.userId ? undefined : input.dto.guestEmail?.toLowerCase(),
        orderType: 'STANDARD',
        cart: { items: cartItems },
        shippingAddress,
        billingAddress,
        shippingMethodId: shippingMethod.id,
        shippingMethodName: shippingMethod.name,
        shippingCost: shippingMethod.calculatedRate,
        taxAmount,
        subtotal,
        discountAmount,
        total,
        currency: cart.currency,
      });
      // 4. Create payment with the selected provider
      const paymentProvider = (input.dto.paymentProvider || '').toLowerCase().trim();
      if (!['razorpay', 'paypal', 'crypto'].includes(paymentProvider)) {
        throw new BadRequestException('Please select Razorpay, PayPal, or Crypto as your payment method.');
      }

      const paymentResult = await this.payments.createPayment({
        orderId: order.id,
        amount: total,
        currency: cart.currency,
        provider: paymentProvider,
        paymentMethod: input.dto.paymentMethod,
        metadata: { orderNumber: order.orderNumber },
      });

      payment = paymentResult.payment;
      approveUrl = paymentResult.approveUrl;
      publicKey = paymentResult.publicKey;

      this.logger.log(`Payment created for ${order.orderNumber}: ${payment.provider}`);

    } catch (error) {
      // If order/payment creation fails, release reserved stock
      this.logger.error(`Order creation failed, releasing reserved stock: ${error.message}`);

      for (const reserved of reservedItems) {
        try {
          await this.inventory.release(
            reserved.variantId,
            reserved.quantity,
            `Order creation failed - releasing reservation`,
          );
        } catch (releaseError) {
          this.logger.error(`Failed to release stock for variant ${reserved.variantId}: ${releaseError.message}`);
        }
      }

      throw error;
    }

    // Cart is cleared only after payment is successfully verified.
    return {
      order,
      payment,
      clientSecret,
      publicKey,
      providerOrderId: payment?.providerPaymentId,
      approveUrl,
      paymentProvider: payment?.provider,
      discountAmount,
      ...(payment?.provider === 'crypto' && payment.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata) ? { crypto: { network: (payment.metadata as Record<string, unknown>).network, asset: (payment.metadata as Record<string, unknown>).asset, address: (payment.metadata as Record<string, unknown>).receivingAddress, amount: (payment.metadata as Record<string, unknown>).expectedAmount, currency: (payment.metadata as Record<string, unknown>).settlementCurrency } } : {}),
      ...(!input.userId ? { guestAccessToken: this.orders.createGuestAccessToken(order) } : {}),
    };
  }

  private async resolveBillingAddress(
    userId: string | undefined,
    dto: CreateCheckoutOrderDto,
    shippingAddress: GuestCheckoutAddressDto | Awaited<ReturnType<AddressesService['findOne']>>,
  ): Promise<GuestCheckoutAddressDto | Awaited<ReturnType<AddressesService['findOne']>>> {
    if (userId) {
      if (dto.guestBillingAddress) {
        throw new BadRequestException('Invalid billing address selection.');
      }

      if (dto.billingAddressId) {
        return this.addresses.findOne(dto.billingAddressId, userId);
      }

      return shippingAddress;
    }

    return dto.guestBillingAddress ?? shippingAddress;
  }

  private async resolveShippingAddress(
    userId: string | undefined,
    dto: CreateCheckoutOrderDto,
  ): Promise<GuestCheckoutAddressDto | Awaited<ReturnType<AddressesService['findOne']>>> {
    if (userId) {
      if (!dto.shippingAddressId) throw new BadRequestException('shippingAddressId is required for signed-in customers.');
      return this.addresses.findOne(dto.shippingAddressId, userId);
    }
    if (!dto.guestEmail || !dto.guestShippingAddress) {
      throw new BadRequestException('guestEmail and guestShippingAddress are required for guest checkout.');
    }
    return dto.guestShippingAddress;
  }

  async createOrderFromCheckout(data: {
    userId?: string;
    guestEmail?: string;
    addressId: string;
    shippingMethodId: string;
    cartItems: any[];
    shippingCost: number;
    taxAmount: number;
    subtotal: number;
    total: number;
    currency: string;
  }): Promise<any> {
    let shippingAddress, billingAddress;
    if (data.userId) {
      shippingAddress = await this.addresses.findOne(data.addressId, data.userId);
    } else {
      throw new BadRequestException('Guest checkout address handling deferred to Phase 6.');
    }

    billingAddress = shippingAddress;

    const shippingMethod = await this.prisma.shippingMethod.findUnique({
      where: { id: data.shippingMethodId },
    });
    if (!shippingMethod) throw new BadRequestException('Invalid shipping method.');

    const order = await this.orders.create({
      userId: data.userId,
      guestEmail: data.guestEmail,
      orderType: 'STANDARD',
      cart: { items: data.cartItems },
      shippingAddress,
      billingAddress,
      shippingMethodId: data.shippingMethodId,
      shippingMethodName: shippingMethod.name,
      shippingCost: data.shippingCost,
      taxAmount: data.taxAmount,
      subtotal: data.subtotal,
      total: data.total,
      currency: data.currency,
    });

    const payment = await this.payments.create({
      orderId: order.id,
      provider: 'pending',
      amount: data.total,
      currency: data.currency,
      metadata: { orderNumber: order.orderNumber },
    });

    return { order, payment };
  }

  async createOrderFromCustomDesign(data: {
    userId: string;
    customRequestId: string;
    customDesignId: string;
    addressId: string;
    shippingMethodId: string;
    shippingCost: number;
    taxAmount: number;
    subtotal: number;
    total: number;
    currency: string;
  }): Promise<any> {
    const design = await this.prisma.customDesign.findUnique({
      where: { id: data.customDesignId },
      include: { customRequest: true },
    });
    if (!design || design.approvalStatus !== 'APPROVED') {
      throw new BadRequestException('Custom design must be approved before checkout.');
    }

    if (design.customRequest.status !== 'APPROVED' && design.customRequest.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Custom request not ready for checkout.');
    }

    const shippingAddress = await this.addresses.findOne(data.addressId, data.userId);
    const billingAddress = shippingAddress;

    const shippingMethod = await this.prisma.shippingMethod.findUnique({
      where: { id: data.shippingMethodId },
    });
    if (!shippingMethod) throw new BadRequestException('Invalid shipping method.');

    const order = await this.orders.create({
      userId: data.userId,
      orderType: 'CUSTOM',
      customRequestId: data.customRequestId,
      shippingAddress,
      billingAddress,
      shippingMethodId: data.shippingMethodId,
      shippingMethodName: shippingMethod.name,
      shippingCost: data.shippingCost,
      taxAmount: data.taxAmount,
      subtotal: data.subtotal,
      total: data.total,
      currency: data.currency,
    });

    const payment = await this.payments.create({
      orderId: order.id,
      provider: 'pending',
      amount: data.total,
      currency: data.currency,
      metadata: { orderNumber: order.orderNumber, customRequestId: data.customRequestId },
    });

    await this.prisma.customRequest.update({
      where: { id: data.customRequestId },
      data: { approvedDesignId: data.customDesignId, status: 'APPROVED' },
    });

    return { order, payment };
  }
}

