import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  /** Selected customization options (e.g. { "Size": "Large", "Color": "Blue" }) */
  @IsOptional()
  @IsObject()
  customization?: Record<string, unknown>;
}
