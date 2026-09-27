import { Type, Transform } from 'class-transformer';
import {
  IsEmail,
  IsISO31661Alpha2,
  IsOptional,
  IsString,
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
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsISO31661Alpha2()
  country!: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
}

export class CreateCheckoutOrderDto {
  @IsOptional() @IsString() shippingMethodId?: string;
  @IsOptional() @IsString() shippingAddressId?: string;
  @IsOptional() @IsString() billingAddressId?: string;
  @IsOptional() @IsEmail() guestEmail?: string;
  @IsOptional() @IsString() paymentProvider?: string;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() @MaxLength(50) couponCode?: string;
  @IsOptional() @ValidateNested() @Type(() => GuestCheckoutAddressDto)
  guestShippingAddress?: GuestCheckoutAddressDto;
  @IsOptional() @ValidateNested() @Type(() => GuestCheckoutAddressDto)
  guestBillingAddress?: GuestCheckoutAddressDto;
}


