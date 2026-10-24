import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCustomRequestDto {
  @IsString()
  @MaxLength(160)
  title!: string;

  @IsString()
  @MaxLength(10000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  dimensions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  designNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  preferredColors?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  materialPreference?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  quantityRequested?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  budgetRange?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  productId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoryId?: string;

  @IsOptional()
  @IsUUID('4')
  submissionKey?: string;
}