import { IsString, IsOptional } from 'class-validator';

export class AddToWishlistDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;
}
