import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import type { Venue } from '@/types';

import { OccupancyBadge } from './OccupancyBadge';

const MUSICA_LABEL: Record<string, string> = {
  reggaeton: 'Reggaetón',
  electronica: 'Electrónica',
  banda: 'Banda',
  pop: 'Pop',
  rock: 'Rock',
  hiphop: 'Hip-Hop',
  variado: 'Variado',
};

/** Tarjeta de un lugar en el listado. */
export function VenueCard({
  venue,
  onPress,
}: {
  venue: Venue;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: venue.fotos[0] }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.nombre} numberOfLines={1}>
            {venue.nombre}
          </Text>
          <OccupancyBadge level={venue.ocupacion} size="sm" />
        </View>
        <Text style={styles.zona}>
          {venue.zona}
          {venue.distanciaKm != null
            ? ` · ${venue.distanciaKm.toFixed(1)} km`
            : ''}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {venue.tiposMusica.map((m) => MUSICA_LABEL[m] ?? m).join(' · ')}
          </Text>
          <Text style={styles.meta}>
            {venue.cover > 0 ? `Cover $${venue.cover}` : 'Sin cover'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: colors.surfaceAlt,
  },
  body: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  nombre: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  zona: {
    color: colors.textMuted,
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
