import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AdminTwoFactorDisableDto {
  @IsString()
  @MinLength(12)
  @MaxLength(72)
  password!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Two-factor code must be 6 digits.' })
  code!: string;
}
