import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Alta de un cliente nuevo: corporativo + su primer antro + la cuenta
 * Dueño que se le entrega — reservado a Super Admin (ver onboarding.
 * module-definition.ts: "onboarding.crear_cliente" no se asigna a
 * ningún otro rol en seed.ts).
 */
export class CrearClienteDto {
  @IsString()
  @MinLength(1)
  nombreComercial: string;

  @IsString()
  @MinLength(1)
  antroNombre: string;

  @IsOptional()
  @IsString()
  antroCiudad?: string;

  @IsString()
  @MinLength(1)
  duenoNombre: string;

  @IsEmail()
  duenoEmail: string;

  @IsString()
  @MinLength(8)
  duenoPasswordInicial: string;
}
