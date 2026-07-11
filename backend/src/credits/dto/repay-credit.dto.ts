import { IsNumber, IsEnum, IsString, IsOptional, IsDateString, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class RepayCreditDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsDateString()
  repaidAt: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  observations?: string;
}
