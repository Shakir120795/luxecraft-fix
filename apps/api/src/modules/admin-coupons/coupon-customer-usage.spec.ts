import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  redeemCouponCustomerUsage,
  releaseCouponCustomerUsage,
  reserveCouponCustomerUsage,
} from './coupon-customer-usage';

describe('coupon customer usage counters', () => {
  const makeTx = () => ({
    couponCustomerUsage: {
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
  }) as unknown as Prisma.TransactionClient;

  it('reserves a slot using the authenticated user unique key', async () => {
    const tx = makeTx();
    const upsert = jest.mocked(tx.couponCustomerUsage.upsert);
    upsert.mockResolvedValue({ usedCount: 0, reservedCount: 1 } as never);

    await reserveCouponCustomerUsage(tx, 'coupon-1', 'user-1', undefined, 1);

    expect(upsert).toHaveBeenCalledWith({
      where: { couponId_userId: { couponId: 'coupon-1', userId: 'user-1' } },
      create: { couponId: 'coupon-1', userId: 'user-1', reservedCount: 1 },
      update: { reservedCount: { increment: 1 } },
    });
  });

  it('normalizes guest emails before reserving a slot', async () => {
    const tx = makeTx();
    const upsert = jest.mocked(tx.couponCustomerUsage.upsert);
    upsert.mockResolvedValue({ usedCount: 0, reservedCount: 1 } as never);

    await reserveCouponCustomerUsage(tx, 'coupon-1', undefined, ' Guest@Example.com ', 1);

    expect(upsert).toHaveBeenCalledWith({
      where: {
        couponId_guestEmail: {
          couponId: 'coupon-1',
          guestEmail: 'guest@example.com',
        },
      },
      create: {
        couponId: 'coupon-1',
        guestEmail: 'guest@example.com',
        reservedCount: 1,
      },
      update: { reservedCount: { increment: 1 } },
    });
  });

  it('rejects a reservation that would exceed the per-customer cap', async () => {
    const tx = makeTx();
    jest.mocked(tx.couponCustomerUsage.upsert).mockResolvedValue({
      usedCount: 1,
      reservedCount: 1,
    } as never);

    await expect(
      reserveCouponCustomerUsage(tx, 'coupon-1', 'user-1', undefined, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('releases only an outstanding reservation', async () => {
    const tx = makeTx();
    const updateMany = jest.mocked(tx.couponCustomerUsage.updateMany);
    updateMany.mockResolvedValue({ count: 1 } as never);

    await releaseCouponCustomerUsage(tx, 'coupon-1', 'user-1');

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        couponId: 'coupon-1',
        userId: 'user-1',
        reservedCount: { gt: 0 },
      },
      data: { reservedCount: { decrement: 1 } },
    });
  });

  it('converts a guest reservation into a redeemed use', async () => {
    const tx = makeTx();
    const updateMany = jest.mocked(tx.couponCustomerUsage.updateMany);
    updateMany.mockResolvedValue({ count: 1 } as never);

    await redeemCouponCustomerUsage(tx, 'coupon-1', undefined, 'Guest@Example.com');

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        couponId: 'coupon-1',
        guestEmail: 'guest@example.com',
        reservedCount: { gt: 0 },
      },
      data: {
        reservedCount: { decrement: 1 },
        usedCount: { increment: 1 },
      },
    });
  });
});