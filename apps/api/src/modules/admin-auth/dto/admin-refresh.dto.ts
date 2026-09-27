import { IsOptional, IsString } from 'class-validator';

export class AdminRefreshDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
