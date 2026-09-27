import { IsIn, IsOptional, IsString } from 'class-validator';

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
}
