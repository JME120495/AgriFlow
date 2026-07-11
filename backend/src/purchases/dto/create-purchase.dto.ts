import { IsNumber, IsString, IsOptional, IsUUID, IsEnum, Min } from 'class-validator';

export class CreatePurchaseDto {
  @IsOptional()
  @IsUUID()
  planterId?: string;

  @IsOptional()
  @IsUUID()
  subBuyerId?: string;

  @IsUUID()
  storeId: string;

  @IsString()
  campaign: string;

  @IsOptional()
  @IsString()
  lotNumber?: string;

  @IsNumber()
  @Min(1)
  bagCount: number;

  @IsString()
  packagingType: string;

  @IsNumber()
  @Min(0)
  weightGross: number;

  @IsNumber()
  @Min(0)
  weightBags: number;

  @IsNumber()
  moistureRate: number;

  @IsNumber()
  impurityRate: number;

  @IsNumber()
  moldyRate: number;

  @IsNumber()
  slatyRate: number;

  @IsNumber()
  insectRate: number;

  @IsNumber()
  grainage: number;

  @IsNumber()
  pricePerKg: number;

  @IsOptional()
  @IsString()
  scaleModel?: string;

  @IsOptional()
  @IsString()
  scaleSerialNumber?: string;
}
