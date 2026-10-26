import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  CustomQuote,
  QuoteStatus,
  Prisma,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  CustomRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { PaymentProviderService } from '../payments/payment-provider.service';
import { CryptoProvider } from '../payments/providers/crypto.provider';

@Injectable()
export class CustomQuotesService {
  private readonly logger = new Logger(CustomQuotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly paymentProviders: PaymentProviderService,
    private readonly cryptoProvider: CryptoProvider,
  ) {}

  async create(data: {
    customRequestId: string;
    baseProductPrice: number;
    designFee: number;
    materialFee?: number;
    dimensionFee?: number;
    rushFee?: number;
    subtotal: number;
    discount?: number;
    shippingEstimate?: number;
    taxEstimate?: number;
    total: number;
    currency?: string;
    description?: string;
    expiresAt?: Date;
  }): Promise<CustomQuote> {
    const req = await this.prisma.customRequest.findUnique({
      where: { id: data.customRequestId },
    });
    if (!req) throw new NotFoundException(`Custom request not found.`);

    // Creating another quote is a revision. Retire unpaid checkout sessions for
    // the previous version and require the customer to accept the new total.
    const quoteNumber = await this.generateQuoteNumber();

    return this.prisma.$transaction(async (tx) => {
      const latestQuote = await tx.customQuote.findFirst({
        where: { customRequestId: data.customRequestId },
        orderBy: { version: 'desc' },
        include: { order: { include: { payments: true } } },
      });

      if (latestQuote?.order) {
        const previousOrder = latestQuote.order;
        const settledStatuses = [
          PaymentStatus.PAID,
          PaymentStatus.PARTIALLY_REFUNDED,
          PaymentStatus.REFUNDED,
        ];
        if (
          previousOrder.paymentStatus === PaymentStatus.PAID ||
          previousOrder.payments.some((payment) => settledStatuses.includes(payment.status))
        ) {
          throw new BadRequestException(
            'This quote already has a captured payment and cannot be revised. Contact support for a price adjustment or refund.',
          );
        }

        const activePayments = previousOrder.payments.filter(
          (payment) => payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.AUTHORIZED,
        );
        if (activePayments.length > 0) {
          const cancelled = await tx.payment.updateMany({
            where: {
              id: { in: activePayments.map((payment) => payment.id) },
              status: { in: [PaymentStatus.PENDING, PaymentStatus.AUTHORIZED] },
            },
            data: { status: PaymentStatus.CANCELLED },
          });
          if (cancelled.count !== activePayments.length) {
            throw new BadRequestException(
              'A previous payment is changing state. Refresh and try revising the quote again.',
            );
          }
        }

        await tx.order.update({
          where: { id: previousOrder.id },
          data: {
            orderStatus: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.CANCELLED,
            fulfillmentStatus: FulfillmentStatus.CANCELLED,
          },
        });
      }

      if (latestQuote) {
        await tx.customQuote.update({
          where: { id: latestQuote.id },
          data: { status: QuoteStatus.REVISED, customerStatus: QuoteStatus.PENDING },
        });
        await tx.customRequest.update({
          where: { id: data.customRequestId },
          data: { status: CustomRequestStatus.AWAITING_APPROVAL },
        });
      }

      const nextVersion = (latestQuote?.version ?? 0) + 1;
      return tx.customQuote.create({
        data: {
          customRequestId: data.customRequestId,
          quoteNumber,
          version: nextVersion,
          baseProductPrice: new Prisma.Decimal(data.baseProductPrice),
          designFee: new Prisma.Decimal(data.designFee),
          materialFee: new Prisma.Decimal(data.materialFee ?? 0),
          dimensionFee: new Prisma.Decimal(data.dimensionFee ?? 0),
          rushFee: new Prisma.Decimal(data.rushFee ?? 0),
          subtotal: new Prisma.Decimal(data.subtotal),
          discount: new Prisma.Decimal(data.discount ?? 0),
          shippingEstimate: new Prisma.Decimal(data.shippingEstimate ?? 0),
          taxEstimate: new Prisma.Decimal(data.taxEstimate ?? 0),
          total: new Prisma.Decimal(data.total),
          currency: data.currency ?? 'USD',
          description: data.description,
          expiresAt: data.expiresAt,
          status: QuoteStatus.DRAFT,
          customerStatus: QuoteStatus.PENDING,
        },
      });
    });
  }

  async findOne(id: string): Promise<CustomQuote> {
    const quote = await this.prisma.customQuote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException(`Quote ${id} not found.`);
    return quote;
  }

  async findAllForRequest(customRequestId: string): Promise<CustomQuote[]> {
    return this.prisma.customQuote.findMany({
      where: { customRequestId },
      orderBy: { version: 'asc' },
    });
  }

  async updateStatus(
    id: string,
    status: QuoteStatus,
    customerStatus?: QuoteStatus,
  ): Promise<CustomQuote> {
    return this.prisma.customQuote.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(customerStatus && { customerStatus }),
      },
    });
  }

  async customerAcceptQuote(id: string): Promise<CustomQuote> {
    const quote = await this.prisma.customQuote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException(`Quote ${id} not found.`);

    if (quote.expiresAt && quote.expiresAt.getTime() <= Date.now()) {
      await this.prisma.customQuote.update({
        where: { id },
        data: { status: QuoteStatus.EXPIRED, customerStatus: QuoteStatus.EXPIRED },
      });
      throw new BadRequestException('This quote has expired. Please ask Wolhomes for an updated quote.');
    }

    const latestQuote = await this.prisma.customQuote.findFirst({
      where: { customRequestId: quote.customRequestId },
      orderBy: { version: 'desc' },
      select: { id: true },
    });
    if (latestQuote?.id !== quote.id) {
      throw new BadRequestException('This quote has been superseded. Please review the latest quote before ordering.');
    }

    if (quote.status === QuoteStatus.ACCEPTED && quote.customerStatus === QuoteStatus.ACCEPTED) {
      return quote;
    }
    if (quote.status === QuoteStatus.REJECTED || quote.customerStatus === QuoteStatus.REJECTED) {
      throw new BadRequestException('A rejected quote cannot be accepted.');
    }

    return this.prisma.$transaction(async (tx) => {
      const accepted = await tx.customQuote.update({
        where: { id },
        data: {
          status: QuoteStatus.ACCEPTED,
          customerStatus: QuoteStatus.ACCEPTED,
        },
      });
      await tx.customRequest.update({
        where: { id: quote.customRequestId },
        data: { status: 'APPROVED' },
      });
      return accepted;
    });
  }

  /**
   * Create or resume a payment for a customer-approved quote. An accepted quote
   * is linked to at most one order, so retries cannot create duplicate orders.
   */
  async startCheckout(
    quoteId: string,
    userId: string,
    requestedProvider: string,
    requestedNetwork?: string,
    requestedAsset?: string,
  ): Promise<Record<string, unknown>> {
    const quote = await this.prisma.customQuote.findUnique({
      where: { id: quoteId },
      include: {
        customRequest: true,
        order: { include: { items: true, payments: true } },
      },
    });
    if (!quote || quote.customRequest.userId !== userId) {
      throw new NotFoundException('Custom quote not found.');
    }
    if (quote.status !== QuoteStatus.ACCEPTED || quote.customerStatus !== QuoteStatus.ACCEPTED) {
      throw new BadRequestException('Please accept this quote before proceeding to payment.');
    }
    if (quote.expiresAt && quote.expiresAt.getTime() <= Date.now()) {
      await this.prisma.customQuote.update({
        where: { id: quoteId },
        data: { status: QuoteStatus.EXPIRED, customerStatus: QuoteStatus.EXPIRED },
      });
      throw new BadRequestException('This quote has expired. Please request an updated quote.');
    }

    const latestQuote = await this.prisma.customQuote.findFirst({
      where: { customRequestId: quote.customRequestId },
      orderBy: { version: 'desc' },
      select: { id: true },
    });
    if (latestQuote?.id !== quote.id) {
      throw new BadRequestException('This quote has been superseded. Please pay only for the latest accepted quote.');
    }

    const amount = Number(quote.total);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('The quote total must be greater than zero before payment.');
    }
    const currency = quote.currency.toUpperCase();
    const requested = String(requestedProvider || '').toLowerCase().trim();
    const configuration = this.paymentProviders.status(currency);
    const availableProviders = configuration.providers.length
      ? configuration.providers
      : configuration.configured
        ? [configuration.provider]
        : [];
    if (!['paypal', 'razorpay', 'crypto'].includes(requested)) {
      throw new BadRequestException('Choose PayPal, Razorpay, or Crypto to pay for a custom design.');
    }
    if (!configuration.currencySupported) {
      throw new BadRequestException(`Wolhomes checkout is not configured for ${currency}.`);
    }
    if (!availableProviders.includes(requested)) {
      throw new BadRequestException(
        requested === 'paypal'
          ? `PayPal is not configured for ${currency}. PayPal does not support every store currency; choose another available gateway.`
          : requested === 'razorpay'
            ? `Razorpay is not configured for ${currency}. Choose another available gateway.`
            : `Crypto payments are not configured for ${currency}.`,
      );
    }
    const cryptoNetwork = String(requestedNetwork || '').trim().toLowerCase();
    const cryptoAsset = String(requestedAsset || '').trim().toUpperCase();
    if (requested === 'crypto') {
      if (currency !== 'USD') {
        throw new BadRequestException('Crypto payments are currently available only for USD custom-design quotes.');
      }
      const supportedPair = (configuration.cryptoPaymentOptions || []).some(
        (option) => option.network === cryptoNetwork && option.asset === cryptoAsset,
      );
      if (!supportedPair) {
        throw new BadRequestException('Choose a configured crypto network and asset for this quote.');
      }
    }

    let order = quote.order;
    if (order?.paymentStatus === PaymentStatus.PAID) {
      return {
        success: true,
        alreadyPaid: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        currency,
        total: amount,
      };
    }

    if (!order) {
      const quantity = Math.max(1, Math.floor(Number(quote.customRequest.quantityRequested) || 1));
      const subtotal = Number(quote.subtotal);
      try {
        order = await this.prisma.$transaction(async (tx) => {
          const existing = await tx.order.findUnique({
            where: { customQuoteId: quote.id },
            include: { items: true, payments: true },
          });
          if (existing) return existing;

          return tx.order.create({
            data: {
              orderNumber: `CD-${quote.quoteNumber}`,
              userId,
              orderType: 'CUSTOM',
              customQuoteId: quote.id,
              orderStatus: OrderStatus.PENDING,
              paymentStatus: PaymentStatus.PENDING,
              fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
              shippingSnapshot: {
                status: 'ADDRESS_PENDING',
                note: 'Shipping address will be confirmed before fulfillment.',
              } as Prisma.InputJsonValue,
              billingSnapshot: { status: 'ADDRESS_PENDING' } as Prisma.InputJsonValue,
              shippingMethodName: 'Custom Design',
              currency,
              subtotal: new Prisma.Decimal(subtotal),
              discountAmount: new Prisma.Decimal(Number(quote.discount)),
              shippingCost: new Prisma.Decimal(Number(quote.shippingEstimate)),
              taxAmount: new Prisma.Decimal(Number(quote.taxEstimate)),
              total: new Prisma.Decimal(amount),
              items: {
                create: [{
                  productSnapshot: {
                    name: quote.customRequest.title,
                    sku: quote.quoteNumber,
                    description: quote.description || quote.customRequest.description,
                    quoteNumber: quote.quoteNumber,
                    customRequestNumber: quote.customRequest.customRequestNumber,
                    itemType: 'CUSTOM_DESIGN',
                  } as Prisma.InputJsonValue,
                  customization: {
                    customQuoteId: quote.id,
                    customRequestId: quote.customRequestId,
                    quoteNumber: quote.quoteNumber,
                  } as Prisma.InputJsonValue,
                  quantity,
                  unitPrice: new Prisma.Decimal((subtotal / quantity).toFixed(2)),
                  totalPrice: new Prisma.Decimal(subtotal.toFixed(2)),
                }],
              },
            },
            include: { items: true, payments: true },
          });
        });
      } catch (error) {
        // Another click/tab may have created the linked order at the same time.
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          const existingOrder = await this.prisma.order.findUnique({
            where: { customQuoteId: quote.id },
            include: { items: true, payments: true },
          });
          if (existingOrder) order = existingOrder;
        } else {
          throw error;
        }
        if (!order) throw error;
      }
    }

    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('This custom-design order is not available for payment.');
    }

    // Resume the current gateway session when it matches the customer's selection.
    // If they choose a different provider, retire the old local session before creating
    // a new one. Verification endpoints reject retired sessions so stale tabs cannot pay it.
    const activePayment = order.payments.find(
      (item) => item.status === PaymentStatus.PENDING || item.status === PaymentStatus.AUTHORIZED,
    );
    if (activePayment) {
      const metadata =
        activePayment.metadata &&
        typeof activePayment.metadata === 'object' &&
        !Array.isArray(activePayment.metadata)
          ? (activePayment.metadata as Record<string, unknown>)
          : {};
      const provider = activePayment.provider.toLowerCase();

      if (provider !== requested) {
        const cancelled = await this.payments.cancelPendingPayment(activePayment.id);
        if (!cancelled) {
          throw new BadRequestException('The previous payment is changing state. Refresh the quote before switching payment methods.');
        }
      } else if (provider === 'crypto') {
        const network = String(metadata.network || '').trim().toLowerCase();
        const asset = String(metadata.asset || '').trim().toUpperCase();
        const address = String(metadata.receivingAddress || '').trim();
        const cryptoAmount = Number(metadata.expectedAmount || activePayment.amount);
        if (!network || !asset || !address || !Number.isFinite(cryptoAmount) || cryptoAmount <= 0) {
          throw new BadRequestException('The pending crypto payment details are incomplete. Contact support before retrying.');
        }
        if (network !== cryptoNetwork || asset !== cryptoAsset) {
          const cancelled = await this.payments.cancelPendingPayment(activePayment.id);
          if (!cancelled) {
            throw new BadRequestException('The previous crypto payment is changing state. Refresh the quote before choosing another asset.');
          }
        } else {
          return {
            success: true,
            alreadyPaid: false,
            orderId: order.id,
            orderNumber: order.orderNumber,
            payment: activePayment,
            provider: 'crypto',
            crypto: {
              network,
              asset,
              address,
              amount: cryptoAmount,
              currency: String(metadata.settlementCurrency || 'USD'),
              instructions: String(metadata.instructions || `Send exactly ${cryptoAmount.toFixed(2)} ${asset} on ${network} network to the address shown above. Do not send through another network.`),
              qrPayload: String(metadata.qrPayload || address),
            },
            currency,
            total: amount,
          };
        }
      } else {
        const providerOrderId = provider === 'paypal'
          ? String(metadata.paypalOrderId || activePayment.providerPaymentId || '')
          : String(metadata.razorpayOrderId || activePayment.providerPaymentId || '');

        // Older PayPal payment rows may not contain an approval URL. In that case
        // replace only the still-pending payment session so the customer can resume.
        if (provider === 'paypal' && typeof metadata.approveUrl !== 'string') {
          const cancelled = await this.payments.cancelPendingPayment(activePayment.id);
          if (!cancelled) {
            throw new BadRequestException('The previous payment is changing state. Refresh the quote before trying again.');
          }
        } else {
          if (!providerOrderId) {
            throw new BadRequestException('The pending payment reference is missing. Contact support before retrying payment.');
          }
          return {
            success: true,
            alreadyPaid: false,
            orderId: order.id,
            orderNumber: order.orderNumber,
            payment: activePayment,
            provider,
            providerOrderId,
            publicKey: this.paymentProviders.publicKeyFor(provider),
            approveUrl: typeof metadata.approveUrl === 'string' ? metadata.approveUrl : undefined,
            currency,
            total: amount,
          };
        }
      }
    }

    const result = await this.payments.createPayment({
      orderId: order.id,
      amount,
      currency,
      provider: requested,
      paymentMethod: requested === 'crypto' ? `crypto:${cryptoAsset}:${cryptoNetwork}` : requested,
      metadata: {
        orderNumber: order.orderNumber,
        customQuoteId: quote.id,
        customRequestId: quote.customRequestId,
        quoteNumber: quote.quoteNumber,
      },
    });

    return {
      success: true,
      alreadyPaid: false,
      orderId: order.id,
      orderNumber: order.orderNumber,
      payment: result.payment,
      provider: result.provider,
      providerOrderId: result.providerOrderId,
      publicKey: result.publicKey,
      approveUrl: result.approveUrl,
      crypto: result.crypto,
      currency,
      total: amount,
    };
  }


  async customerRejectQuote(id: string): Promise<CustomQuote> {
    return this.updateStatus(id, QuoteStatus.REJECTED, QuoteStatus.REJECTED);
  }

  async customerRequestRevision(id: string): Promise<CustomQuote> {
    return this.updateStatus(id, QuoteStatus.REVISED, QuoteStatus.PENDING);
  }

  private async generateQuoteNumber(): Promise<string> {
    const count = await this.prisma.customQuote.count();
    return `QT-${(count + 1).toString().padStart(6, '0')}`;
  }
}
