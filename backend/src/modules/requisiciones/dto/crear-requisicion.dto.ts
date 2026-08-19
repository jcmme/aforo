import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MinLength } from 'class-validator';

export class CrearRequisicionDto {
  @IsUUID()
  antroId: string;

  @IsNumber()
  @IsPositive()
  montoSolicitado: number;

  @IsString()
  @MinLength(1)
  destino: string;

  @IsOptional()
  @IsString()
  nota?: string;

  @IsDateString()
  fechaGastoProgramada: string;
}
