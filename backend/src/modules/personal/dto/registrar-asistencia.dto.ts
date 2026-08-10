import { IsDateString, IsEnum, IsOptional, IsUUID, Matches } from 'class-validator';
import { AsistenciaEstado } from '../entities/asistencia.entity';

const FORMATO_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class RegistrarAsistenciaDto {
  @IsUUID()
  empleadoId: string;

  @IsDateString()
  fecha: string;

  @IsEnum(AsistenciaEstado)
  estado: AsistenciaEstado;

  @IsOptional()
  @Matches(FORMATO_HORA, { message: 'horaEntrada debe tener formato HH:mm' })
  horaEntrada?: string;

  @IsOptional()
  @Matches(FORMATO_HORA, { message: 'horaSalida debe tener formato HH:mm' })
  horaSalida?: string;
}
