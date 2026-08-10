import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export enum ResolucionRequisicion {
  APROBADA = 'aprobada',
  RECHAZADA = 'rechazada',
  AJUSTADA = 'ajustada',
}

export class ResolverRequisicionDto {
  @IsEnum(ResolucionRequisicion)
  estado: ResolucionRequisicion;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  montoResuelto?: number;

  @IsOptional()
  @IsString()
  notaResolucion?: string;
}
