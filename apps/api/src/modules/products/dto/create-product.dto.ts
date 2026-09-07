import {
  IsString, IsOptional, IsEnum, IsBoolean,
  IsNumber, IsPositive, MaxLength, MinLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  /** Auto-generated from name if omitted. */
  @IsOptional()
  @IsString()
  @MaxLength(350)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  material?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  style?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  collection?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  color?: string;
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  deliveryInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  shippingInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  returnsInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  careInstructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  origin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  productNote?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  regularPrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  salePrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  weightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  lengthCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  widthCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  heightCm?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDesc?: string;

  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @IsOptional()
  @IsBoolean()
  allowBackorder?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isCustomizable?: boolean;
}
