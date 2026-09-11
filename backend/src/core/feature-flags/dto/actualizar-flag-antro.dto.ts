import { IsBoolean, IsString, IsUUID, MinLength } from 'class-validator';

export class ActualizarFlagAntroDto {
  @IsUUID()
  antroId: string;

  @IsString()
  @MinLength(1)
  featureCodigo: string;

  @IsBoolean()
  activo: boolean;
}
