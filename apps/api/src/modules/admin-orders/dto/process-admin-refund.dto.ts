import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export enum AdminRefundMode {
  GATEWAY = 'GATEWAY',
  MANUAL = 'MANUAL',
}

export class ProcessAdminRefundDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  refundAmount!: number;

  @IsOptional()
  @IsEnum(AdminRefundMode)
  mode: AdminRefundMode = AdminRefundMode.GATEWAY;

  @ValidateIf((value: ProcessAdminRefundDto) => value.mode === AdminRefundMode.MANUAL)
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  manualReference?: string;

  @ValidateIf((value: ProcessAdminRefundDto) => value.mode === AdminRefundMode.MANUAL)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
