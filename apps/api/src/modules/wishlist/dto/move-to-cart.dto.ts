import { IsString, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class MoveToCartDto {
  @IsString()
  wishlistItemId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  customization?: Record<string, unknown>;
}
