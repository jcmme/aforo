import { Controller, Get } from '@nestjs/common';
import { AntrosService } from './antros.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsuarioAutenticado } from '../auth/jwt-payload.interface';

@Controller('antros')
export class AntrosController {
  constructor(private readonly antrosService: AntrosService) {}

  @Get()
  listar(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.antrosService.listarAccesibles(usuario);
  }
}
