import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton, Campo } from '@/components/ui';
import { generarReporte, REPORTES, type Reporte } from '@/data/gestion';
import { colors, font, radius, spacing } from '@/theme';
import type { FormatoReporte, ReporteDef } from '@/types';

const FORMATOS: { v: FormatoReporte; label: string }[] = [
  { v: 'excel', label: 'Excel' },
  { v: 'pdf', label: 'PDF' },
  { v: 'ambos', label: 'Ambos' },
];

/** Ventana "DATOS EXTRAÍBLES": un botón por reporte → formato + rango → generar. */
export default function DatosScreen() {
  const [sel, setSel] = useState<ReporteDef | null>(null);
  const [formato, setFormato] = useState<FormatoReporte>('excel');
  const [desde, setDesde] = useState('2026-06-01');
  const [hasta, setHasta] = useState('2026-06-30');
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [copiado, setCopiado] = useState(false);

  function generar() {
    if (!sel) return;
    setReporte(generarReporte(sel.clave));
  }

  async function copiar() {
    if (!reporte) return;
    await Clipboard.setStringAsync(reporte.csv);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }

  // Vista de configuración + resultado de un reporte.
  if (sel) {
    return (
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
        <Text style={font.kicker}>Reporte</Text>
        <Text style={font.h2}>{sel.titulo}</Text>
        <Text style={font.muted}>{sel.descripcion}</Text>

        <Text style={styles.label}>Formato</Text>
        <View style={styles.formatos}>
          {FORMATOS.map((f) => (
            <Pressable key={f.v} style={[styles.fmt, formato === f.v && styles.fmtActivo]} onPress={() => setFormato(f.v)}>
              <Text style={[styles.fmtTxt, formato === f.v && { color: '#04141A' }]}>{f.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Rango de fechas</Text>
        <View style={styles.fechas}>
          <View style={{ flex: 1 }}><Campo etiqueta="Desde" value={desde} onChangeText={setDesde} placeholder="2026-06-01" /></View>
          <View style={{ flex: 1 }}><Campo etiqueta="Hasta" value={hasta} onChangeText={setHasta} placeholder="2026-06-30" /></View>
        </View>

        <Boton titulo="Generar" onPress={generar} />

        {reporte ? (
          <View style={styles.resultado}>
            <Text style={styles.label}>Vista previa ({reporte.filas.length} filas)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <View style={styles.fila}>
                  {reporte.columnas.map((c) => (
                    <Text key={c} style={[styles.celda, styles.celdaHead]}>{c}</Text>
                  ))}
                </View>
                {reporte.filas.slice(0, 12).map((f, i) => (
                  <View key={i} style={styles.fila}>
                    {f.map((v, j) => (
                      <Text key={j} style={styles.celda}>{v}</Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
            <Boton titulo={copiado ? 'CSV copiado' : 'Copiar CSV'} variante="secundario" onPress={copiar} />
            <Text style={styles.nota}>
              La descarga en Excel/PDF se genera con una librería/Edge Function (pendiente).
              El formato elegido fue: {formato}. Aquí va la vista previa de los datos reales.
            </Text>
          </View>
        ) : null}

        <Boton titulo="Volver a reportes" variante="secundario" onPress={() => { setSel(null); setReporte(null); }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.title}>DATOS EXTRAÍBLES</Text>
      <Text style={font.muted}>Un botón por reporte. Elige formato y rango, y genera.</Text>
      <View style={styles.grid}>
        {REPORTES.map((r) => (
          <Pressable key={r.clave} style={styles.repCard} onPress={() => { setSel(r); setReporte(null); }}>
            <Text style={styles.repTitulo}>{r.titulo}</Text>
            <Text style={styles.repDesc} numberOfLines={3}>{r.descripcion}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  repCard: { width: '47%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.xs, minHeight: 110 },
  repTitulo: { color: colors.text, fontSize: 15, fontWeight: '800' },
  repDesc: { color: colors.textMuted, fontSize: 12 },
  label: { ...font.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm },
  formatos: { flexDirection: 'row', gap: spacing.sm },
  fmt: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  fmtActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  fmtTxt: { color: colors.text, fontWeight: '800' },
  fechas: { flexDirection: 'row', gap: spacing.sm },
  resultado: { gap: spacing.sm, marginTop: spacing.sm },
  fila: { flexDirection: 'row' },
  celda: { color: colors.textMuted, fontSize: 12, paddingVertical: 6, paddingHorizontal: spacing.sm, minWidth: 90, borderBottomWidth: 1, borderBottomColor: colors.border },
  celdaHead: { color: colors.text, fontWeight: '800' },
  nota: { color: colors.textFaint, fontSize: 12 },
});
