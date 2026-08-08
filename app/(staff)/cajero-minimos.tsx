import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { listarConsumoMinimos } from '@/data/cajero';
import { colors, font, radius, spacing } from '@/theme';
import type { ConsumoMinimoItem } from '@/types';

/** Ventana "C. Mínimos": referencia de solo lectura para concretar el cobro. */
export default function CajeroMinimosScreen() {
  const [items, setItems] = useState<ConsumoMinimoItem[]>([]);

  useEffect(() => {
    listarConsumoMinimos().then(setItems);
  }, []);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.muted}>
        Todas las reservas de mesa por app y su consumo mínimo. Dato de referencia,
        NO editable. El cajero consulta; el capitán es quien hace cumplir.
      </Text>
      {items.map((m) => (
        <View key={m.reservaId} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={font.h3} numberOfLines={1}>{m.reservaNombre}</Text>
            <Text style={font.muted}>{m.mesaTexto ?? 'Sin mesa'}</Text>
          </View>
          <View style={styles.montos}>
            <Text style={styles.min}>${m.consumoMinimo.toLocaleString('es-MX')}</Text>
            <Text style={styles.real}>
              {m.consumoReal != null ? `real $${m.consumoReal.toLocaleString('es-MX')}` : 'pendiente'}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  montos: { alignItems: 'flex-end' },
  min: { color: colors.text, fontWeight: '800', fontSize: 15 },
  real: { color: colors.textMuted, fontSize: 12 },
});
