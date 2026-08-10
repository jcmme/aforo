import { IsObject, IsOptional, IsString } from 'class-validator';

export class ExportarReporteDto {
  @IsString()
  plantillaCodigo: string;

  @IsOptional()
  @IsObject()
  filtros?: Record<string, unknown>;
}
