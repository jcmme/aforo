import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CrearReservaDto {
  @IsUUID()
  antroId: string;

  @IsString()
  @MinLength(1)
  clienteNombre: string;

  @IsOptional()
  @IsString()
  clienteTelefono?: string;

  @IsDateString()
  fechaEvento: string;

  @IsInt()
  @Min(1)
  numPersonas: number;

  @IsOptional()
  @IsString()
  notas?: string;
}
