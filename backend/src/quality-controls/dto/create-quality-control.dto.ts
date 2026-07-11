import { IsString, IsUUID, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateQualityControlDto {
  @IsUUID()
  purchaseId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  moistureRate: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  impurityRate: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  moldyRate: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  slatyRate: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  insectRate: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  brokenRate: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  flatRate: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  germinatedRate: number;

  @IsNumber()
  @Min(0)
  grainage: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  wetBagsCount?: number;

  @IsString()
  @IsOptional()
  smell?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  bagCondition?: string;

  @IsString()
  @IsOptional()
  observations?: string;
}
