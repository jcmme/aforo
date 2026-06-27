import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { listarIncidencias } from '@/data/gestion';
import { colors, font, radius, spacing } from '@/theme';

const CORP_ID = 'corp-1';

const ETIQUETA_TIPO: Record<string, string> = {
  override_amarillo: 'Override amarillo',
  acceso_manual_otro: 'Acceso manual "Otro"',
  alerta_fantasma: 'Alerta fantasma',
  consumo_minimo_no_cumplido: 'Consumo mínimo',
};

const FILTROS = ['Todas', 'override_amarillo', 'acceso_manual_otro', 'alerta_fantasma', 'consumo_minimo_no_cumplido'];

/** Panel Cadena: concentra toda anomalía de la bitácora, con hora y responsable. */
export default function CadenaScreen() {
  const [filtro, setFiltro] = useState('Todas');
  const todas = listarIncidencias(CORP_ID);
  const lista = filtro === 'Todas' ? todas : todas.filter((i) => i.tipo === filtro);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.muted}>
        Todo lo que se salió del flujo normal: accesos manuales, overrides, alertas de
        fantasma y motivos "Otro". Con hora y responsable.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
        {FILTROS.map((f) => (
          <Pressable key={f} style={[styles.chip, filtro === f && styles.chipActivo]} onPress={() => setFiltro(f)}>
            <Text style={[styles.chipTxt, filtro === f && { color: '#04141A' }]}>
              {f === 'Todas' ? 'Todas' : ETIQUETA_TIPO[f] ?? f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {lista.map((i) => (
        <View key={i.id} style={styles.card}>
          <View style={styles.head}>
            <Text style={styles.tipo}>{ETIQUETA_TIPO[i.tipo] ?? i.tipo}</Text>
            <Text style={styles.hora}>
              {new Date(i.cuando).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={styles.resumen}>{i.resumen}</Text>
          <Text style={font.muted}>{i.antro} · {i.responsable}</Text>
        </View>
      ))}
      {lista.length === 0 ? <Text style={font.muted}>Sin incidencias para este filtro.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  filtros: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: { paddingVertical: 6, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tipo: { color: colors.accent, fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  hora: { color: colors.textFaint, fontSize: 12 },
  resumen: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
