import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario, UsuarioEstado } from '../identidad/entities/usuario.entity';
import { JwtPayload, UsuarioAutenticado } from './jwt-payload.interface';
import { RbacService } from '../rbac/rbac.service';

/**
 * Qué permiso "ver" habilita cada sección del menú. Vive aquí porque solo
 * lo usa /auth/me — si se necesitara en más lugares, se movería a
 * module-registry para que cada módulo declare su propia sección.
 */
const SECCION_POR_PERMISO: Record<string, string> = {
  metricas: 'metricas.ver',
  reservas: 'reservas.ver',
  requisiciones: 'requisiciones.ver',
  personal: 'personal.ver',
  nomina: 'nomina.ver',
  proveedores: 'proveedores.ver',
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly jwtService: JwtService,
    private readonly rbacService: RbacService,
  ) {}

  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const usuario = await this.usuarioRepo.findOne({ where: { email } });

    if (!usuario || usuario.estado !== UsuarioEstado.ACTIVO) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const passwordValido = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    usuario.ultimoLogin = new Date();
    await this.usuarioRepo.save(usuario);

    const payload: JwtPayload = { sub: usuario.id, email: usuario.email, corporativoId: usuario.corporativoId };
    return { accessToken: this.jwtService.sign(payload) };
  }

  async cambiarPassword(usuarioId: string, passwordActual: string, passwordNuevo: string): Promise<void> {
    const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) throw new UnauthorizedException();

    const passwordValido = await bcrypt.compare(passwordActual, usuario.passwordHash);
    if (!passwordValido) {
      throw new BadRequestException('La contraseña actual no es correcta.');
    }
    if (passwordActual === passwordNuevo) {
      throw new BadRequestException('La contraseña nueva debe ser distinta de la actual.');
    }

    usuario.passwordHash = await bcrypt.hash(passwordNuevo, 10);
    await this.usuarioRepo.save(usuario);
  }

  /** Secciones del menú que este usuario puede ver, según lo que ya resuelve el RBAC. */
  async obtenerSecciones(usuario: UsuarioAutenticado): Promise<string[]> {
    const secciones: string[] = [];
    for (const [seccion, permiso] of Object.entries(SECCION_POR_PERMISO)) {
      const scope = await this.rbacService.resolveDataScope(usuario.id, usuario.corporativoId, permiso);
      if (scope) secciones.push(seccion);
    }
    return secciones;
  }
}
