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
});
