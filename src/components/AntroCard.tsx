import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, familias, gradients, radius, spacing } from '@/theme';
import type { Antro } from '@/types';

/** Tarjeta de un antro en el listado de "explorar". */
export function AntroCard({ antro, onPress }: { antro: Antro; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.press]} onPress={onPress}>
      {/* Respaldo elegante: si la foto no carga, queda un degradado, no un hueco. */}
      <LinearGradient colors={gradients.foto} style={styles.fondo} />
      <Image source={{ uri: antro.fotos[0] }} style={styles.image} resizeMode="cover" />
      <LinearGradient colors={gradients.scrim} style={styles.scrim} />
      <View style={styles.zonaPill}>
        <Text style={styles.zonaPillTxt}>{antro.zona}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.nombre} numberOfLines={1}>
          {antro.nombre}
        </Text>
        <Text style={styles.horario} numberOfLines={1}>
          {antro.horario}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 210,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'flex-end',
  },
  press: { opacity: 0.92 },
  fondo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  zonaPill: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(9,9,11,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(236,230,218,0.45)',
  },
  zonaPillTxt: {
    color: colors.accentSoft,
    fontFamily: familias.sansSemi,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  body: { padding: spacing.lg },
  nombre: { color: '#fff', fontFamily: familias.displaySemi, fontSize: 28, letterSpacing: 0.2 },
  horario: { color: 'rgba(245,244,241,0.72)', fontFamily: familias.sans, fontSize: 13, marginTop: 3 },
});
