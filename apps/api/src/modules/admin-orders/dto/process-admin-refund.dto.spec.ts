import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  AdminRefundMode,
  ProcessAdminRefundDto,
} from './process-admin-refund.dto';

describe('ProcessAdminRefundDto', () => {
  it('accepts a gateway refund amount', async () => {
    const dto = plainToInstance(ProcessAdminRefundDto, {
      refundAmount: 25,
      mode: AdminRefundMode.GATEWAY,
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
  });

  it('requires a reference for manual refunds', async () => {
    const dto = plainToInstance(ProcessAdminRefundDto, {
      refundAmount: 25,
      mode: AdminRefundMode.MANUAL,
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.some((error) => error.property === 'manualReference')).toBe(true);
  });

  it('rejects non-positive refund amounts', async () => {
    const dto = plainToInstance(ProcessAdminRefundDto, {
      refundAmount: 0,
      mode: AdminRefundMode.GATEWAY,
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.some((error) => error.property === 'refundAmount')).toBe(true);
  });
});
