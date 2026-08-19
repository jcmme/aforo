import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';
import { UsuarioAutenticado } from './jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  /** Con qué secciones arma el frontend el menú lateral de este usuario. */
  @Get('me')
  async me(@CurrentUser() usuario: UsuarioAutenticado) {
    const secciones = await this.authService.obtenerSecciones(usuario);
    return { email: usuario.email, secciones };
  }

  @Patch('password')
  @HttpCode(204)
  async cambiarPassword(@Body() dto: CambiarPasswordDto, @CurrentUser() usuario: UsuarioAutenticado) {
    await this.authService.cambiarPassword(usuario, dto.passwordActual, dto.passwordNuevo);
  }
}
