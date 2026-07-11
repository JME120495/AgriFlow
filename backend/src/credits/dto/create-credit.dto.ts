import { IsEnum, IsNumber, IsString, IsOptional, IsUUID, IsDateString, Min } from 'class-validator';
import { BeneficiaryType, PaymentMethod } from '@prisma/client';

export class CreateCreditDto {
  @IsEnum(BeneficiaryType)
  beneficiaryType: BeneficiaryType;

  @IsUUID()
  beneficiaryId: string;

  @IsUUID()
  categoryId: string;

  @IsNumber()
  @Min(1)
  amountGranted: number;

  @IsDateString()
  grantedAt: string;

  @IsDateString()
  dueDate: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  sourceAccount: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
