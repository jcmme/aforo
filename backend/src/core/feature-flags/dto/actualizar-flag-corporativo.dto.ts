import { IsBoolean, IsString, IsUUID, MinLength } from 'class-validator';

export class ActualizarFlagCorporativoDto {
  @IsUUID()
  corporativoId: string;

  @IsString()
  @MinLength(1)
  featureCodigo: string;

  @IsBoolean()
  activo: boolean;
}
