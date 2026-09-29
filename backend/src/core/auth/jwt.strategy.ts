import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import type { Request } from 'express';
import { JwtPayload, UsuarioAutenticado, VerComo } from './jwt-payload.interface';
import { RbacService } from '../rbac/rbac.service';
import { Antro } from '../identidad/entities/antro.entity';
import { Corporativo } from '../identidad/entities/corporativo.entity';

export const HEADER_VER_COMO_CORPORATIVO = 'x-ver-como-corporativo';
export const HEADER_VER_COMO_ANTRO = 'x-ver-como-antro';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly rbacService: RbacService,
    @InjectRepository(Antro)
    private readonly antroRepo: Repository<Antro>,
    @InjectRepository(Corporativo)
    private readonly corporativoRepo: Repository<Corporativo>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'cambia-este-secreto-en-produccion'),
      passReqToCallback: true,
    });
  }

  /**
   * "Entrar como" un cliente: el Súper Admin manda uno de los dos headers y,
   * solo para ese request, opera con el corporativo del cliente — así cada
   * módulo (que ya filtra por usuario.corporativoId) se comporta solo como
   * ese cliente. Se revisa en BD en cada request que de verdad sea Súper
   * Admin: el header de cualquier otro usuario se rechaza con 403.
   */
  async validate(req: Request, payload: JwtPayload): Promise<UsuarioAutenticado> {
    const esSuperAdmin = await this.rbacService.esSuperAdmin(payload.sub);
    const usuario: UsuarioAutenticado = {
      id: payload.sub,
      email: payload.email,
      corporativoId: payload.corporativoId,
      esSuperAdmin,
      viendoComo: null,
    };

    const antroId = req.header(HEADER_VER_COMO_ANTRO);
    const corporativoId = req.header(HEADER_VER_COMO_CORPORATIVO);
    if (!antroId && !corporativoId) return usuario;

    if (!esSuperAdmin) throw new ForbiddenException('Solo el Súper Admin puede entrar como otro cliente.');

    const viendoComo = await this.resolverVerComo(antroId, corporativoId);
    return { ...usuario, corporativoId: viendoComo.corporativoId, viendoComo };
  }

  private async resolverVerComo(antroId: string | undefined, corporativoId: string | undefined): Promise<VerComo> {
    if (antroId) {
      const antro = isUUID(antroId) ? await this.antroRepo.findOne({ where: { id: antroId } }) : null;
      if (!antro) throw new NotFoundException('Ese antro no existe.');
      return { corporativoId: antro.corporativoId, antroId: antro.id };
    }

    const corporativo = isUUID(corporativoId) ? await this.corporativoRepo.findOne({ where: { id: corporativoId } }) : null;
    if (!corporativo) throw new NotFoundException('Ese corporativo no existe.');
    return { corporativoId: corporativo.id, antroId: null };
  }
}
