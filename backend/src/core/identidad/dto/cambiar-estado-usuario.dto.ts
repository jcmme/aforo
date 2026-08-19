import { IsEnum } from 'class-validator';
import { UsuarioEstado } from '../entities/usuario.entity';

export class CambiarEstadoUsuarioDto {
  @IsEnum(UsuarioEstado)
  estado: UsuarioEstado;
}
