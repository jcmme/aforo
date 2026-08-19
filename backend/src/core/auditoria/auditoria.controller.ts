import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { PermissionGuard } from '../rbac/permission.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';
import { CurrentDataScope } from '../rbac/data-scope.decorator';
import { DataScope } from '../rbac/data-scope';

@Controller('auditoria')
@UseGuards(PermissionGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @RequirePermission('auditoria.ver')
  async listar(@CurrentDataScope() dataScope: DataScope) {
    const registros = await this.auditoriaService.listar(dataScope);
    return registros.map((r) => ({
      id: r.id,
      accion: r.accion,
      entidad: r.entidad,
      entidadId: r.entidadId,
      detalle: r.detalle,
      actor: r.actorUsuario?.nombre ?? '—',
      actorEmail: r.actorUsuario?.email ?? '—',
      createdAt: r.createdAt,
    }));
  }
}
