import { IsString, IsOptional, IsEnum, IsInt, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryChange } from '@prisma/client';

export class AdjustInventoryDto {
  @IsString()
  @MaxLength(100)
  variantId!: string;

  @IsEnum(InventoryChange)
  changeType!: InventoryChange;

  @Type(() => Number)
  @IsInt()
  delta!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;
}
