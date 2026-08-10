import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class RegistrarNominaDetalleDto {
  @IsUUID()
  empleadoId: string;

  @IsNumber()
  @Min(0)
  horasTrabajadas: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  faltas?: number;

  @IsNumber()
  @Min(0)
  percepciones: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deducciones?: number;
}
