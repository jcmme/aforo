import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportRequest } from './entities/export-request.entity';
import { PdfRendererService } from './pdf-renderer.service';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExportRequest])],
  controllers: [ExportController],
  providers: [PdfRendererService, ExportService],
})
export class ExportModule {}
