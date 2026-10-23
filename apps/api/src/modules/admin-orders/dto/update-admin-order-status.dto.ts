import { IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

const ORDER_STATUS_VALUES = [
  'PENDING',
  'PAYMENT_CONFIRMED',
  'PROCESSING',
  'READY_TO_SHIP',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'FAILED',
  'REFUNDED',
  'RETURNED',
  'ON_HOLD',
] as const;

export class UpdateAdminOrderStatusDto {
  @IsOptional()
  @IsString()
  @IsIn(ORDER_STATUS_VALUES)
  orderStatus?: (typeof ORDER_STATUS_VALUES)[number];

  @IsOptional()
  @IsString()
  @IsIn(['UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'])
  fulfillmentStatus?: 'UNFULFILLED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  courierName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  trackingNumber?: string | null;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(1000)
  trackingUrl?: string | null;
}
