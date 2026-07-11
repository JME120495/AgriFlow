import { IsString, IsBoolean, IsNumber, IsOptional, IsUUID, IsEnum } from 'class-validator';

export enum RefactionPenaltyTypeDto {
  WEIGHT_KG = 'WEIGHT_KG',
  PERCENT_WEIGHT = 'PERCENT_WEIGHT',
  AMOUNT_FCFA = 'AMOUNT_FCFA',
  REJECT = 'REJECT',
}

export class UpdateRuleDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  threshold: number;

  @IsEnum(RefactionPenaltyTypeDto)
  penaltyType: RefactionPenaltyTypeDto;

  @IsNumber()
  penaltyValue: number;

  @IsString()
  @IsOptional()
  formula?: string;

  @IsNumber()
  @IsOptional()
  maxLimit?: number;

  @IsString()
  @IsOptional()
  campaign?: string;

  @IsUUID()
  @IsOptional()
  storeId?: string;

  @IsString()
  @IsOptional()
  clientExport?: string;
}
