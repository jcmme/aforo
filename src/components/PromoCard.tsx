import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, familias, gradients, radius, spacing } from '@/theme';
import type { PromoDisponible } from '@/types';

/**
 * Tarjeta de promoción. `destacada` = hero grande (difusión pagada, SIN letrero
 * de "pagada"); `lista` = tarjeta editorial estándar. Título en serif Cormorant
 * sobre la foto, con scrim para legibilidad. Lleva a su antro dueño.
 */
export function PromoCard({
  promo,
  variante = 'lista',
  onPress,
}: {
  promo: PromoDisponible;
  variante?: 'destacada' | 'lista';
  onPress: () => void;
}) {
  const esHero = variante === 'destacada';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        esHero ? styles.hero : styles.lista,
        pressed && styles.press,
      ]}
      onPress={onPress}
    >
      <LinearGradient colors={gradients.foto} style={styles.fill} />
      {promo.foto ? <Image source={{ uri: promo.foto }} style={styles.fill} resizeMode="cover" /> : null}
      <LinearGradient colors={gradients.scrim} style={styles.fill} />

      <View style={styles.body}>
        <Text style={styles.kicker} numberOfLines={1}>
          {promo.antroNombre}
          {promo.zona ? ` · ${promo.zona}` : ''}
        </Text>
        <Text style={[styles.titulo, esHero && styles.tituloHero]} numberOfLines={2}>
          {promo.nombre}
        </Text>
        {esHero ? (
          <View style={styles.cta}>
            <Text style={styles.ctaTxt}>Reservar en {promo.antroNombre}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    justifyContent: 'flex-end',
  },
  hero: { height: 264 },
  lista: { height: 178 },
  press: { opacity: 0.9 },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  body: { padding: spacing.lg, gap: 4 },
  kicker: {
    color: colors.accentSoft,
    fontFamily: familias.sansSemi,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  titulo: {
    color: '#FFFFFF',
    fontFamily: familias.displaySemi,
    fontSize: 24,
    letterSpacing: 0.2,
    lineHeight: 27,
  },
  tituloHero: { fontSize: 30, lineHeight: 33 },
  cta: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
  },
  ctaTxt: { color: colors.onAccent, fontFamily: familias.sansSemi, fontSize: 13, letterSpacing: 0.2 },
});
