import { IsString, Matches, MaxLength } from 'class-validator';

export class AdminTwoFactorVerifyDto {
  @IsString()
  @MaxLength(128)
  challengeToken!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Two-factor code must be 6 digits.' })
  code!: string;
}
