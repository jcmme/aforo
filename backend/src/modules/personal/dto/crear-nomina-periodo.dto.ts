import { IsDateString, IsUUID } from 'class-validator';

export class CrearNominaPeriodoDto {
  @IsUUID()
  antroId: string;

  @IsDateString()
  periodoInicio: string;

  @IsDateString()
  periodoFin: string;
}
