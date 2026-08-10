import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MinLength } from 'class-validator';

export class CrearCompraDto {
  @IsUUID()
  antroId: string;

  @IsUUID()
  proveedorId: string;

  @IsOptional()
  @IsUUID()
  requisicionId?: string;

  @IsString()
  @MinLength(1)
  descripcion: string;

  @IsNumber()
  @IsPositive()
  monto: number;

  @IsDateString()
  fecha: string;
}
