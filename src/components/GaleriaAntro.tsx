import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  FlatList,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { colors, familias, gradients, spacing } from '@/theme';

/**
 * Galería del antro: varias fotos (solo aprobadas) que el cliente desliza
 * horizontalmente de forma fluida (paginado). Todas al mismo encuadre 3:2 para
 * que la galería nunca "salte". Puntos + contador cuando hay más de una.
 */
export function GaleriaAntro({ fotos }: { fotos: string[] }) {
  const { width } = useWindowDimensions();
  const alto = Math.round((width * 2) / 3); // 3:2 horizontal
  const [idx, setIdx] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIdx(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  if (fotos.length === 0) {
    return <LinearGradient colors={gradients.foto} style={{ width, height: alto }} />;
  }

  return (
    <View style={{ width, height: alto }}>
      <FlatList
        data={fotos}
        keyExtractor={(u, i) => `${i}-${u}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={onScroll}
        renderItem={({ item }) => (
          <View style={{ width, height: alto }}>
            <LinearGradient colors={gradients.foto} style={styles.fill} />
            <Image source={{ uri: item }} style={styles.fill} resizeMode="cover" />
          </View>
        )}
      />

      {fotos.length > 1 ? (
        <>
          <View style={styles.contador}>
            <Text style={styles.contadorTxt}>
              {idx + 1} / {fotos.length}
            </Text>
          </View>
          <View style={styles.puntos}>
            {fotos.map((_, i) => (
              <View key={i} style={[styles.punto, i === idx && styles.puntoOn]} />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.surfaceAlt },
  contador: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(9,9,11,0.6)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  contadorTxt: { color: colors.text, fontFamily: familias.medium, fontSize: 12, letterSpacing: 0.5 },
  puntos: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(245,244,241,0.4)' },
  puntoOn: { backgroundColor: colors.accent, width: 18 },
});
