import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OccupancyBadge } from '@/components/OccupancyBadge';
import { obtenerVenue } from '@/data/venues';
import { colors, radius, spacing } from '@/theme';
import type { Venue } from '@/types';

const MUSICA_LABEL: Record<string, string> = {
  reggaeton: 'Reggaetón',
  electronica: 'Electrónica',
  banda: 'Banda',
  pop: 'Pop',
  rock: 'Rock',
  hiphop: 'Hip-Hop',
  variado: 'Variado',
};

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoLabel}>{label}</Text>
      <Text style={styles.datoValue}>{value}</Text>
    </View>
  );
}

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerVenue(id)
      .then(setVenue)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Lugar no encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
    >
      <Image source={{ uri: venue.fotos[0] }} style={styles.hero} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.nombre}>{venue.nombre}</Text>
          <OccupancyBadge level={venue.ocupacion} />
        </View>
        <Text style={styles.zona}>
          {venue.zona} · {venue.direccion}
        </Text>

        {venue.descripcion ? (
          <Text style={styles.desc}>{venue.descripcion}</Text>
        ) : null}

        <View style={styles.card}>
          <Dato label="Horario" value={venue.horario} />
          <Dato
            label="Cover"
            value={venue.cover > 0 ? `$${venue.cover} MXN` : 'Sin cover'}
          />
          <Dato
            label="Música"
            value={venue.tiposMusica
              .map((m) => MUSICA_LABEL[m] ?? m)
              .join(', ')}
          />
          <Dato
            label="Aforo actualizado"
            value={new Date(venue.ocupacionActualizada).toLocaleString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: 'short',
            })}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: { color: colors.textMuted },
  hero: { width: '100%', height: 280, backgroundColor: colors.surfaceAlt },
  body: { padding: spacing.lg, gap: spacing.sm },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  nombre: { flex: 1, color: colors.text, fontSize: 26, fontWeight: '800' },
  zona: { color: colors.textMuted, fontSize: 14 },
  desc: { color: colors.text, fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  dato: { gap: 2 },
  datoLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  datoValue: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
