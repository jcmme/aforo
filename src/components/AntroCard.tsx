import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import type { Antro } from '@/types';

/** Tarjeta de un antro en el listado de "explorar". */
export function AntroCard({ antro, onPress }: { antro: Antro; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: antro.fotos[0] }} style={styles.image} resizeMode="cover" />
      <View style={styles.overlay} />
      <View style={styles.body}>
        <Text style={styles.nombre} numberOfLines={1}>
          {antro.nombre}
        </Text>
        <Text style={styles.zona} numberOfLines={1}>
          {antro.zona} · {antro.horario}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'flex-end',
  },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,7,13,0.45)',
  },
  body: { padding: spacing.lg },
  nombre: { color: colors.text, fontSize: 22, fontWeight: '800' },
  zona: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
});
