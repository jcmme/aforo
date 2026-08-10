import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario, UsuarioEstado } from '../identidad/entities/usuario.entity';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly jwtService: JwtService,
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
}
