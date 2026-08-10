import { IsDateString, IsNumber, IsPositive, IsString, IsUUID, MinLength } from 'class-validator';

export class CrearRequisicionDto {
  @IsUUID()
  antroId: string;

  @IsNumber()
  @IsPositive()
  montoSolicitado: number;

  @IsString()
  @MinLength(1)
  destino: string;

  @IsDateString()
  fechaGastoProgramada: string;
}
