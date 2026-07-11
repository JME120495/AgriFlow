import { IsString, IsNumber, IsOptional, IsUUID, Min, MaxLength } from 'class-validator';

export class CreateWarehouseDto {
  @IsUUID()
  storeId: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Min(0.1)
  capacityTonnes: number;
}

export class CreateStorageZoneDto {
  @IsUUID()
  warehouseId: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  cocoaGrade?: string; // GRADE_1, GRADE_2, SOUS_GRADE
}

export class CreateStorageLocationDto {
  @IsUUID()
  zoneId: string;

  @IsString()
  @MaxLength(30)
  code: string;

  @IsNumber()
  @Min(100)
  capacityKg: number;
}

export class CreateStockMovementDto {
  @IsString()
  type: string; // IN_PURCHASE, OUT_SALE, INTERNAL_TRANSFER, INTER_STORE_TRANSFER, INVENTORY_CORRECTION

  @IsNumber()
  @Min(0.1)
  weightKg: number;

  @IsNumber()
  @Min(1)
  bagCount: number;

  @IsUUID()
  @IsOptional()
  sourceLocationId?: string;

  @IsUUID()
  @IsOptional()
  destLocationId?: string;

  @IsUUID()
  storeId: string;

  @IsUUID()
  @IsOptional()
  referenceId?: string;
}

export class CreateInventoryDto {
  @IsUUID()
  storeId: string;
}

export class SubmitInventoryItemDto {
  @IsUUID()
  locationId: string;

  @IsNumber()
  @Min(0)
  physicalWeight: number;

  @IsNumber()
  @Min(0)
  physicalBags: number;
}
