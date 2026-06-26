import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import type { Evento } from '@/types';

const FORMATO_FECHA: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
};

/** Calcula el estado de cupo de un evento para la etiqueta. */
function etiquetaCupo(evento: Evento): { texto: string; color: string } {
  const ocupados = evento.lugaresOcupados ?? 0;
  const ratio = ocupados / evento.cupoMaximo;
  if (ratio >= 1) {
    return evento.alLlenar === 'lista_espera'
      ? { texto: 'Lista de espera', color: colors.warning }
      : { texto: 'Lleno', color: colors.danger };
  }
  if (ratio >= 0.85) return { texto: 'Casi lleno', color: colors.warning };
  return { texto: 'Lugares disponibles', color: colors.success };
}

/** Tarjeta de evento dentro de la ficha del antro. */
export function EventoCard({ evento, onPress }: { evento: Evento; onPress: () => void }) {
  const cupo = etiquetaCupo(evento);
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: evento.fotos[0] }} style={styles.image} resizeMode="cover" />
      <View style={styles.body}>
        <Text style={styles.fecha}>
          {new Date(evento.fecha).toLocaleString('es-MX', FORMATO_FECHA)}
        </Text>
        <Text style={styles.nombre} numberOfLines={2}>
          {evento.nombre}
        </Text>
        <View style={styles.cupoRow}>
          <View style={[styles.dot, { backgroundColor: cupo.color }]} />
          <Text style={[styles.cupo, { color: cupo.color }]}>{cupo.texto}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: 96, height: 96, backgroundColor: colors.surfaceAlt },
  body: { flex: 1, padding: spacing.md, gap: 2, justifyContent: 'center' },
  fecha: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nombre: { color: colors.text, fontSize: 15, fontWeight: '700' },
  cupoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  cupo: { fontSize: 12, fontWeight: '600' },
});
