import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateAdminOrderStatusDto } from './update-admin-order-status.dto';

describe('UpdateAdminOrderStatusDto', () => {
  it('rejects paymentStatus so it cannot be used by the generic admin status endpoint', async () => {
    const dto = plainToInstance(UpdateAdminOrderStatusDto, {
      paymentStatus: 'PAID',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.some((error) => error.property === 'paymentStatus')).toBe(true);
  });

  it('accepts a valid order status', async () => {
    const dto = plainToInstance(UpdateAdminOrderStatusDto, {
      orderStatus: 'PROCESSING',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid order status', async () => {
    const dto = plainToInstance(UpdateAdminOrderStatusDto, {
      orderStatus: 'PAID',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.some((error) => error.property === 'orderStatus')).toBe(true);
  });

  it('accepts manual courier and HTTPS tracking details', async () => {
    const dto = plainToInstance(UpdateAdminOrderStatusDto, {
      orderStatus: 'SHIPPED',
      courierName: 'FedEx',
      trackingNumber: '123456789012',
      trackingUrl: 'https://www.fedex.com/en-in/tracking.html',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects non-HTTPS tracking URLs', async () => {
    const dto = plainToInstance(UpdateAdminOrderStatusDto, {
      trackingUrl: 'http://example.com/track',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.some((error) => error.property === 'trackingUrl')).toBe(true);
  });
});
