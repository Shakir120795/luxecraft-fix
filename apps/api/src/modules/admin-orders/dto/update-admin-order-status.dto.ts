import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus, FulfillmentStatus } from '@prisma/client';

export class UpdateAdminOrderStatusDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @IsOptional()
  @IsEnum(FulfillmentStatus)
  fulfillmentStatus?: FulfillmentStatus;
}
