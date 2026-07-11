import { IsString, IsNumber, IsOptional, IsUUID, Min, MaxLength } from 'class-validator';

export class CreateLotDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  numeroLot?: string;

  @IsString()
  campagne: string;

  @IsString()
  qualite: string; // GRADE_1, GRADE_2, SOUS_GRADE

  @IsNumber()
  @Min(0.1)
  poidsInitial: number;

  @IsNumber()
  @Min(1)
  nombreSacs: number;

  @IsNumber()
  @Min(0)
  valeurAchat: number;

  @IsUUID()
  emplacementId: string;

  @IsUUID()
  @IsOptional()
  origineId?: string;
}

export class CreateReservationDto {
  @IsUUID()
  lotId: string;

  @IsNumber()
  @Min(0.1)
  quantite: number;

  @IsString()
  @MaxLength(200)
  motif: string;
}

export class CreateStockMovementDto {
  @IsString()
  type: string; // ENTREE, SORTIE, TRANSFERT

  @IsString()
  motif: string; // ACHAT, VENTE, AJUSTEMENT, PERTE...

  @IsNumber()
  @Min(0.1)
  quantite: number;

  @IsNumber()
  @Min(1)
  nombreSacs: number;

  @IsUUID()
  lotId: string;

  @IsUUID()
  @IsOptional()
  emplacementOrigineId?: string;

  @IsUUID()
  @IsOptional()
  emplacementDestId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  observations?: string;
}
