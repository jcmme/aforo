import * as Location from 'expo-location';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterChips } from '@/components/FilterChips';
import { VenueCard } from '@/components/VenueCard';
import { useAuth } from '@/context/AuthContext';
import { listarVenues, ZONAS } from '@/data/venues';
import { colors, spacing } from '@/theme';
import type { MusicType, OccupancyLevel, Venue, VenueFilters } from '@/types';

const ZONA_OPTS = ZONAS.map((z) => ({ value: z, label: z }));

const MUSICA_OPTS: { value: MusicType; label: string }[] = [
  { value: 'reggaeton', label: 'Reggaetón' },
  { value: 'electronica', label: 'Electrónica' },
  { value: 'banda', label: 'Banda' },
  { value: 'hiphop', label: 'Hip-Hop' },
  { value: 'pop', label: 'Pop' },
  { value: 'variado', label: 'Variado' },
];

const AFORO_OPTS: { value: OccupancyLevel; label: string }[] = [
  { value: 'vacio', label: 'Vacío' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'lleno', label: 'Lleno' },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, demo } = useAuth();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [texto, setTexto] = useState('');
  const [zona, setZona] = useState<string | null>(null);
  const [musica, setMusica] = useState<MusicType | null>(null);
  const [aforo, setAforo] = useState<OccupancyLevel | null>(null);
  const [origen, setOrigen] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  // Pide ubicación una vez para ordenar por cercanía (best-effort).
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({});
        setOrigen({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        // Sin ubicación, se muestra el orden por defecto.
      }
    })();
  }, []);

  const cargar = useCallback(async () => {
    const filtros: VenueFilters = { texto, zona, musica, ocupacion: aforo };
    const data = await listarVenues({
      filtros,
      origen: origen ?? undefined,
    });
    setVenues(data);
  }, [texto, zona, musica, aforo, origen]);

  useEffect(() => {
    setLoading(true);
    cargar().finally(() => setLoading(false));
  }, [cargar]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  }, [cargar]);

  return (
    <View style={[styles.container, { paddingTop: spacing.sm }]}>
      <FlatList
        data={venues}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {demo && (
              <View style={styles.demoBanner}>
                <Text style={styles.demoText}>
                  Modo demo · datos de ejemplo. Configura Supabase para datos
                  reales.
                </Text>
              </View>
            )}

            <View style={styles.topRow}>
              <View>
                <Text style={styles.kicker}>Esta noche en la ciudad</Text>
                <Text style={styles.title}>¿A dónde vamos?</Text>
              </View>
              {profile ? (
                <Link href="/admin" asChild>
                  <Pressable style={styles.authPill}>
                    <Text style={styles.authPillText}>
                      {profile.rol === 'venue_staff' ? 'Mi lugar' : 'Mi cuenta'}
                    </Text>
                  </Pressable>
                </Link>
              ) : (
                <Link href="/(auth)/login" asChild>
                  <Pressable style={styles.authPill}>
                    <Text style={styles.authPillText}>Entrar</Text>
                  </Pressable>
                </Link>
              )}
            </View>

            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="Buscar por nombre o zona…"
              placeholderTextColor={colors.textMuted}
              style={styles.search}
            />

            <Text style={styles.filterLabel}>Zona</Text>
            <FilterChips options={ZONA_OPTS} value={zona} onChange={setZona} />
            <Text style={styles.filterLabel}>Música</Text>
            <FilterChips
              options={MUSICA_OPTS}
              value={musica}
              onChange={setMusica}
            />
            <Text style={styles.filterLabel}>Aforo</Text>
            <FilterChips
              options={AFORO_OPTS}
              value={aforo}
              onChange={setAforo}
            />
          </View>
        }
        renderItem={({ item }) => (
          <VenueCard
            venue={item}
            onPress={() => router.push(`/venue/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: spacing.xl }}
            />
          ) : (
            <Text style={styles.empty}>
              No hay lugares que coincidan con tu búsqueda.
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
  demoBanner: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoText: { color: colors.textMuted, fontSize: 12 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  kicker: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  authPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  authPillText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  search: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  filterLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
