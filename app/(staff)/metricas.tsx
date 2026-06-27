import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { metricasAntro, metricasConsolidadas } from '@/data/gestion';
import { colors, font, radius, spacing } from '@/theme';

// Demo: el gerente individual ve su antro (antro-1, corp-1). El consolidado es la
// vista del gerente general (aislado a su corporativo).
const ANTRO_ID = 'antro-1';
const CORP_ID = 'corp-1';

export default function MetricasScreen() {
  const [consolidado, setConsolidado] = useState(false);
  const m = consolidado ? metricasConsolidadas(CORP_ID) : metricasAntro(ANTRO_ID);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <View style={styles.toggle}>
        <Opcion activo={!consolidado} label="Mi antro" onPress={() => setConsolidado(false)} />
        <Opcion activo={consolidado} label="Consolidado" onPress={() => setConsolidado(true)} />
      </View>

      <Text style={font.title}>{m.nombre}</Text>

      <View style={styles.grid}>
        <Card valor={String(m.reservas)} et="Reservas" />
        <Card valor={String(m.llegadas)} et="Llegadas" />
        <Card valor={String(m.noShows)} et="No-shows" color={colors.danger} />
        <Card valor={String(m.canceladas)} et="Canceladas" />
        <Card valor={`${m.ocupacionPct}%`} et="Ocupación" />
        <Card valor={m.diaMayorAfluencia ?? '—'} et="Día pico" />
      </View>

      {/* Penetración: termómetro de adopción */}
      <View style={styles.penet}>
        <Text style={styles.seccion}>Penetración (adopción)</Text>
        <Text style={font.muted}>Entradas con reserva (QR) vs sin reserva (contador).</Text>
        <View style={styles.barra}>
          <View style={[styles.barraCon, { flex: Math.max(1, m.conReserva) }]}>
            <Text style={styles.barraTxt}>{m.conReserva} con QR</Text>
          </View>
          <View style={[styles.barraSin, { flex: Math.max(1, m.sinReserva) }]}>
            <Text style={styles.barraTxt}>{m.sinReserva} sin</Text>
          </View>
        </View>
        <Text style={styles.adopcion}>{m.adopcionPct}% con reserva de la app</Text>
      </View>

      {m.porRP.length > 0 ? (
        <View>
          <Text style={styles.seccion}>Reservas por RP</Text>
          {m.porRP.map((r) => (
            <View key={r.nombre} style={styles.rpRow}>
              <Text style={styles.rpNombre}>{r.nombre}</Text>
              <Text style={font.muted}>{r.reservas} reservas · {r.completas} completas</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={font.muted}>Desglose por RP disponible a nivel de antro.</Text>
      )}
    </ScrollView>
  );
}

function Opcion({ activo, label, onPress }: { activo: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.opcion, activo && styles.opcionActiva]} onPress={onPress}>
      <Text style={[styles.opcionTxt, activo && { color: '#04141A' }]}>{label}</Text>
    </Pressable>
  );
}

function Card({ valor, et, color }: { valor: string; et: string; color?: string }) {
  return (
    <View style={styles.card}>
      <Text style={[styles.cardVal, color ? { color } : null]}>{valor}</Text>
      <Text style={styles.cardEt}>{et}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  toggle: { flexDirection: 'row', gap: spacing.sm },
  opcion: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  opcionActiva: { backgroundColor: colors.primary, borderColor: colors.primary },
  opcionTxt: { color: colors.text, fontWeight: '800', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { width: '31%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center', gap: 2 },
  cardVal: { color: colors.text, fontSize: 22, fontWeight: '900' },
  cardEt: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
  penet: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  seccion: { ...font.h2, marginTop: spacing.sm },
  barra: { flexDirection: 'row', height: 36, borderRadius: radius.sm, overflow: 'hidden', marginTop: spacing.xs },
  barraCon: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  barraSin: { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  barraTxt: { color: colors.text, fontSize: 11, fontWeight: '700' },
  adopcion: { color: colors.primary, fontWeight: '800' },
  rpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: spacing.xs },
  rpNombre: { color: colors.text, fontWeight: '700', fontSize: 15 },
});
