import { IsEmail, IsIn, IsString, IsUUID, MinLength } from 'class-validator';

/**
 * A propósito, corto: la cuenta general de un antro (Gerente de Antro) o
 * el Dueño/Gerente General solo pueden derivar estas tres — nunca Dueño,
 * Gerente General ni Super Admin, que quedan reservados a Super Admin.
 */
export const ROLES_CREABLES = ['Gerente de Antro', 'RP', 'Hostess'] as const;
export type RolCreable = (typeof ROLES_CREABLES)[number];

export class CrearUsuarioDto {
  @IsString()
  @MinLength(1)
  nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  passwordInicial: string;

  @IsIn(ROLES_CREABLES)
  rol: RolCreable;

  @IsUUID()
  antroId: string;
}
