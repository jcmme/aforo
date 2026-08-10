import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ProveedorCategoria } from '../entities/proveedor.entity';

export class CrearProveedorDto {
  @IsString()
  @MinLength(1)
  nombre: string;

  @IsEnum(ProveedorCategoria)
  categoria: ProveedorCategoria;

  @IsOptional()
  @IsString()
  contactoNombre?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
