import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { ModuleRegistryService } from '../module-registry/module-registry.service';
import { RbacService } from '../rbac/rbac.service';
import { PdfRendererService } from './pdf-renderer.service';
import { ExportRequest, ExportEstado } from './entities/export-request.entity';
import { UsuarioAutenticado } from '../auth/jwt-payload.interface';

const CARPETA_EXPORTS = join(process.cwd(), 'storage', 'exports');

@Injectable()
export class ExportService {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly rbacService: RbacService,
    private readonly pdfRenderer: PdfRendererService,
    @InjectRepository(ExportRequest)
    private readonly exportRequestRepo: Repository<ExportRequest>,
  ) {}

  /**
   * El permiso a evaluar NO es un "reportes.exportar" genérico: es el
   * permiso propio del módulo dueño del reporte (ej. "reservas.ver"),
   * para que el mismo alcance que filtra la pantalla filtre también su PDF.
   */
  async generarReporte(
    plantillaCodigo: string,
    filtros: Record<string, unknown>,
    usuario: UsuarioAutenticado,
  ): Promise<{ buffer: Buffer; nombreArchivo: string }> {
    const plantilla = this.moduleRegistry.getReportTemplate(plantillaCodigo);
    if (!plantilla) {
      throw new NotFoundException(`No existe la plantilla de reporte "${plantillaCodigo}".`);
    }

    const dataScope = await this.rbacService.resolveDataScope(usuario.id, usuario.corporativoId, plantilla.permisoRequerido);
    if (!dataScope) {
      throw new ForbiddenException(`No tienes permiso para generar el reporte "${plantillaCodigo}".`);
    }

    const filas = await plantilla.dataProvider({ dataScope, filtros });
    const buffer = await this.pdfRenderer.renderTablaHorizontal(plantilla.titulo, plantilla.columnas, filas);

    const nombreArchivo = `${plantilla.codigo}-${Date.now()}.pdf`;
    const archivoUrl = await this.guardarArchivo(nombreArchivo, buffer);

    await this.exportRequestRepo.save(
      this.exportRequestRepo.create({
        corporativoId: usuario.corporativoId,
        antroId: dataScope.antroIds?.length === 1 ? dataScope.antroIds[0] : null,
        modulo: plantilla.codigo.split('.')[0],
        plantillaCodigo: plantilla.codigo,
        filtros,
        solicitadoPorUsuarioId: usuario.id,
        estado: ExportEstado.GENERADO,
        archivoUrl,
        generadoAt: new Date(),
      }),
    );

    return { buffer, nombreArchivo };
  }

  private async guardarArchivo(nombreArchivo: string, buffer: Buffer): Promise<string> {
    await mkdir(CARPETA_EXPORTS, { recursive: true });
    const ruta = join(CARPETA_EXPORTS, nombreArchivo);
    await writeFile(ruta, buffer);
    return ruta;
  }
}
