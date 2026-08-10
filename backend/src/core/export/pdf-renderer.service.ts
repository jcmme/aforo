import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ReportColumn } from '../module-registry/module-definition.interface';

const COLOR_ENCABEZADO = '#EDEAF0';
const COLOR_TEXTO = '#1C1725';
const COLOR_TEXTO_TENUE = '#5B546A';
const COLOR_BORDE = '#DCD7E2';
const ALTO_FILA = 22;

@Injectable()
export class PdfRendererService {
  /**
   * Layout "tabla_horizontal": una fila por registro, columnas = totales del
   * periodo. Es el mismo renderer para el export de RPs y el de nómina —
   * ningún módulo dibuja su propio PDF, solo declara columnas + filas.
   */
  renderTablaHorizontal(titulo: string, columnas: ReportColumn[], filas: Record<string, unknown>[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).fillColor(COLOR_TEXTO).text(titulo);
      doc.moveDown(0.3);
      doc
        .fontSize(9)
        .fillColor(COLOR_TEXTO_TENUE)
        .text(`Generado ${new Date().toLocaleString('es-MX')} · ${filas.length} registro(s)`);
      doc.moveDown(1);

      const anchoDisponible = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const anchoColumna = anchoDisponible / columnas.length;

      const dibujarEncabezado = () => {
        const x0 = doc.page.margins.left;
        const y0 = doc.y;
        doc.rect(x0, y0, anchoDisponible, ALTO_FILA).fill(COLOR_ENCABEZADO);
        doc.fillColor(COLOR_TEXTO).fontSize(10);
        columnas.forEach((columna, i) => {
          doc.text(columna.etiqueta, x0 + i * anchoColumna + 6, y0 + 6, { width: anchoColumna - 12 });
        });
        doc.y = y0 + ALTO_FILA;
      };

      dibujarEncabezado();
      doc.fontSize(9.5);

      for (const fila of filas) {
        if (doc.y + ALTO_FILA > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          dibujarEncabezado();
          doc.fontSize(9.5);
        }

        const x0 = doc.page.margins.left;
        const y0 = doc.y;
        doc.fillColor(COLOR_TEXTO);
        columnas.forEach((columna, i) => {
          const valor = fila[columna.campo];
          const texto = valor === null || valor === undefined ? '—' : String(valor);
          doc.text(texto, x0 + i * anchoColumna + 6, y0 + 6, { width: anchoColumna - 12 });
        });

        doc
          .moveTo(x0, y0 + ALTO_FILA)
          .lineTo(x0 + anchoDisponible, y0 + ALTO_FILA)
          .strokeColor(COLOR_BORDE)
          .stroke();
        doc.y = y0 + ALTO_FILA;
      }

      if (filas.length === 0) {
        doc.fillColor(COLOR_TEXTO_TENUE).text('Sin registros para este periodo.', doc.page.margins.left, doc.y + 10);
      }

      doc.end();
    });
  }
}
