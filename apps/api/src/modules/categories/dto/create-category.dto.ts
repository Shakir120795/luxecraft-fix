import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsUrl,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CategoryStatus } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  /** If omitted, slug is auto-generated from name. */
  @IsOptional()
  @IsString()
  @MaxLength(250)
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;

  /** External image URL (alternative to upload). */
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageAlt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDesc?: string;
}
