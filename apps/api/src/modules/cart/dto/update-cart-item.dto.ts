import { IsInt, Min, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCartItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsObject()
  customization?: Record<string, unknown>;
}
