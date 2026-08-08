import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, gradients, radius, spacing } from '@/theme';
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
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.press]} onPress={onPress}>
      <View style={styles.imageWrap}>
        <LinearGradient colors={gradients.foto} style={styles.fondo} />
        <Image source={{ uri: evento.fotos[0] }} style={styles.image} resizeMode="cover" />
      </View>
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
  press: { opacity: 0.92 },
  imageWrap: { width: 100, height: 104 },
  fondo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  image: { width: 100, height: 104 },
  body: { flex: 1, padding: spacing.md, gap: 3, justifyContent: 'center' },
  fecha: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  nombre: { color: colors.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  cupoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  cupo: { fontSize: 12, fontWeight: '600' },
});
