import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, gradients, radius, spacing } from '@/theme';
import type { Antro } from '@/types';

/** Tarjeta de un antro en el listado de "explorar". */
export function AntroCard({ antro, onPress }: { antro: Antro; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
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
    height: 200,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'flex-end',
  },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  zonaPill: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(6,182,212,0.18)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  zonaPillTxt: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  body: { padding: spacing.lg },
  nombre: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.3 },
  horario: { color: 'rgba(244,248,251,0.8)', fontSize: 13, marginTop: 2, fontWeight: '600' },
});
