import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type CouponCustomerIdentity = {
  userId?: string | null;
  guestEmail?: string | null;
};

function normalizedIdentity(identity: CouponCustomerIdentity) {
  const userId = identity.userId?.trim();
  if (userId) return { userId };
  const guestEmail = identity.guestEmail?.trim().toLowerCase();
  if (guestEmail) return { guestEmail };
  return null;
}

/**
 * Reserves one customer's coupon slot. Checkout calls this while holding a
 * FOR UPDATE lock on the coupon row, before the order row is created.
 */
export async function reserveCouponCustomerUsage(
  tx: Prisma.TransactionClient,
  couponId: string,
  userId?: string | null,
  guestEmail?: string | null,
  maxPerCustomer?: number | null,
): Promise<void> {
  const identity = normalizedIdentity({ userId, guestEmail });
  if (!identity) {
    if (maxPerCustomer != null) {
      throw new BadRequestException(
        'A customer account or email address is required to use this coupon.',
      );
    }
    return;
  }

  const usage = identity.userId
    ? await tx.couponCustomerUsage.upsert({
        where: {
          couponId_userId: { couponId, userId: identity.userId },
        },
        create: {
          couponId,
          userId: identity.userId,
          reservedCount: 1,
        },
        update: {
          reservedCount: { increment: 1 },
        },
      })
    : await tx.couponCustomerUsage.upsert({
        where: {
          couponId_guestEmail: { couponId, guestEmail: identity.guestEmail },
        },
        create: {
          couponId,
          guestEmail: identity.guestEmail,
          reservedCount: 1,
        },
        update: {
          reservedCount: { increment: 1 },
        },
      });

  // Throwing here rolls back the upsert because the caller runs this helper
  // within the same transaction as the coupon row lock.
  if (maxPerCustomer != null && usage.usedCount + usage.reservedCount > maxPerCustomer) {
    throw new BadRequestException(
      'You have already reached the usage limit for this coupon.',
    );
  }
}

/** Releases one reserved customer slot after failed/cancelled/expired checkout. */
export async function releaseCouponCustomerUsage(
  tx: Prisma.TransactionClient,
  couponId: string,
  userId?: string | null,
  guestEmail?: string | null,
): Promise<void> {
  const identity = normalizedIdentity({ userId, guestEmail });
  if (!identity) return;

  await tx.couponCustomerUsage.updateMany({
    where: {
      couponId,
      ...identity,
      reservedCount: { gt: 0 },
    },
    data: { reservedCount: { decrement: 1 } },
  });
}

/** Converts a single reserved customer slot into a redeemed use exactly once. */
export async function redeemCouponCustomerUsage(
  tx: Prisma.TransactionClient,
  couponId: string,
  userId?: string | null,
  guestEmail?: string | null,
): Promise<void> {
  const identity = normalizedIdentity({ userId, guestEmail });
  if (!identity) return;

  const converted = await tx.couponCustomerUsage.updateMany({
    where: {
      couponId,
      ...identity,
      reservedCount: { gt: 0 },
    },
    data: {
      reservedCount: { decrement: 1 },
      usedCount: { increment: 1 },
    },
  });
  if (converted.count > 0) return;

  // Backward-compatible recovery for a paid RESERVED order that predates these
  // aggregate rows. Order-level RESERVED -> USED remains the idempotency guard.
  if (identity.userId) {
    await tx.couponCustomerUsage.upsert({
      where: {
        couponId_userId: { couponId, userId: identity.userId },
      },
      create: { couponId, userId: identity.userId, usedCount: 1 },
      update: { usedCount: { increment: 1 } },
    });
  } else {
    await tx.couponCustomerUsage.upsert({
      where: {
        couponId_guestEmail: { couponId, guestEmail: identity.guestEmail },
      },
      create: { couponId, guestEmail: identity.guestEmail, usedCount: 1 },
      update: { usedCount: { increment: 1 } },
    });
  }
}
