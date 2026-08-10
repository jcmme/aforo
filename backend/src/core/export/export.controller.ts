import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { ExportarReporteDto } from './dto/exportar-reporte.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsuarioAutenticado } from '../auth/jwt-payload.interface';

@Controller('reportes')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('exportar')
  async exportar(@Body() dto: ExportarReporteDto, @CurrentUser() usuario: UsuarioAutenticado, @Res() res: Response) {
    const { buffer, nombreArchivo } = await this.exportService.generarReporte(
      dto.plantillaCodigo,
      dto.filtros ?? {},
      usuario,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
