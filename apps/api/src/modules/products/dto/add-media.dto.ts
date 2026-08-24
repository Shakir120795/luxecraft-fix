import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUrl,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MediaType } from '@prisma/client';

export class AddMediaDto {
  @IsEnum(MediaType)
  type!: MediaType;

  @IsUrl()
  @MaxLength(2048)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  storageKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  altText?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}
