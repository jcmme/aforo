import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import type { EstadoReserva } from '@/types';

const ESTILO: Record<EstadoReserva, { label: string; color: string }> = {
  confirmada: { label: 'Confirmada', color: colors.success },
  lista_espera: { label: 'Lista de espera', color: colors.warning },
  cancelada: { label: 'Cancelada', color: colors.textFaint },
  no_show: { label: 'No-show', color: colors.danger },
  completada: { label: 'Completada', color: colors.accent },
};

/** Insignia con el estado de una reserva. */
export function EstadoReservaBadge({ estado }: { estado: EstadoReserva }) {
  const { label, color } = ESTILO[estado];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 12, fontWeight: '700' },
});
