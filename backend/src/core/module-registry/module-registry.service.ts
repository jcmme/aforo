import { Injectable, Logger } from '@nestjs/common';
import { ModuleDefinition, ReportTemplateDefinition } from './module-definition.interface';

@Injectable()
export class ModuleRegistryService {
  private readonly logger = new Logger(ModuleRegistryService.name);
  private readonly modulos = new Map<string, ModuleDefinition>();

  register(definicion: ModuleDefinition): void {
    if (this.modulos.has(definicion.codigo)) {
      throw new Error(`El módulo "${definicion.codigo}" ya está registrado.`);
    }
    this.modulos.set(definicion.codigo, definicion);
    this.logger.log(`Módulo registrado: ${definicion.codigo} (${definicion.permisos.length} permisos)`);
  }

  getModulo(codigo: string): ModuleDefinition | undefined {
    return this.modulos.get(codigo);
  }

  getTodosLosModulos(): ModuleDefinition[] {
    return [...this.modulos.values()];
  }

  getReportTemplate(codigo: string): ReportTemplateDefinition | undefined {
    for (const modulo of this.modulos.values()) {
      const plantilla = modulo.reportTemplates?.find((t) => t.codigo === codigo);
      if (plantilla) return plantilla;
    }
    return undefined;
  }
}
