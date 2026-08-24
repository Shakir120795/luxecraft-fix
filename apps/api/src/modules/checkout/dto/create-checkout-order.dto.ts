import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class GuestCheckoutAddressDto {
  @IsString() @MaxLength(100) firstName!: string;
  @IsString() @MaxLength(100) lastName!: string;
  @IsString() @MaxLength(200) addressLine1!: string;
  @IsOptional() @IsString() @MaxLength(200) addressLine2?: string;
  @IsString() @MaxLength(100) city!: string;
  @IsOptional() @IsString() @MaxLength(100) stateProvince?: string;
  @IsString() @MaxLength(30) postalCode!: string;
  @IsString() @Length(2, 2) country!: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
}

export class CreateCheckoutOrderDto {
  @IsString() shippingMethodId!: string;
  @IsOptional() @IsString() shippingAddressId?: string;
  @IsOptional() @IsEmail() guestEmail?: string;
  @IsOptional() @ValidateNested() @Type(() => GuestCheckoutAddressDto)
  guestShippingAddress?: GuestCheckoutAddressDto;
}
