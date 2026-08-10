import { IsEnum, IsOptional, IsPositive, IsString, IsUUID, MinLength } from 'class-validator';
import { EmpleadoPuesto, EmpleadoTipoPago } from '../entities/empleado.entity';

export class CrearEmpleadoDto {
  @IsUUID()
  antroId: string;

  @IsString()
  @MinLength(1)
  nombre: string;

  @IsEnum(EmpleadoPuesto)
  puesto: EmpleadoPuesto;

  @IsEnum(EmpleadoTipoPago)
  tipoPago: EmpleadoTipoPago;

  @IsOptional()
  @IsPositive()
  salarioBase?: number;
}
