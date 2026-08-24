import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddCustomizationOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  groupName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  optionLabel!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceDelta?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
