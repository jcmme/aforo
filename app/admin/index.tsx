import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OccupancyBadge } from '@/components/OccupancyBadge';
import { useAuth } from '@/context/AuthContext';
import { actualizarOcupacion, listarVenuesDeStaff } from '@/data/venues';
import { colors, occupancy, radius, spacing } from '@/theme';
import type { OccupancyLevel, Venue } from '@/types';

const NIVELES: OccupancyLevel[] = ['vacio', 'moderado', 'lleno'];

export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!profile) return;
    // En demo o sin corporativo asignado, usamos el corporativo de ejemplo "c1".
    const corp = profile.corporativoId ?? 'c1';
    const data = await listarVenuesDeStaff(corp);
    setVenues(data);
  }, [profile]);

  useEffect(() => {
    setLoading(true);
    cargar().finally(() => setLoading(false));
  }, [cargar]);

  async function cambiarAforo(venueId: string, nivel: OccupancyLevel) {
    setSaving(venueId);
    try {
      await actualizarOcupacion(venueId, nivel);
      setVenues((prev) =>
        prev.map((v) => (v.id === venueId ? { ...v, ocupacion: nivel } : v)),
      );
    } finally {
      setSaving(null);
    }
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Inicia sesión para gestionar tu lugar.</Text>
        <Link href="/(auth)/login" style={styles.link}>
          Entrar
        </Link>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        padding: spacing.lg,
        paddingBottom: insets.bottom + spacing.xl,
        gap: spacing.lg,
      }}
    >
      <View>
        <Text style={styles.title}>Hola, {profile.nombre ?? 'venue'}</Text>
        <Text style={styles.muted}>
          Mantén tu aforo al día. Es lo que ven los clientes ahora mismo.
        </Text>
      </View>

      {venues.map((v) => (
        <View key={v.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.venueName}>{v.nombre}</Text>
            <OccupancyBadge level={v.ocupacion} size="sm" />
          </View>
          <Text style={styles.muted}>{v.zona}</Text>

          <Text style={styles.label}>Aforo actual</Text>
          <View style={styles.nivelRow}>
            {NIVELES.map((nivel) => {
              const active = v.ocupacion === nivel;
              return (
                <Pressable
                  key={nivel}
                  disabled={saving === v.id}
                  onPress={() => cambiarAforo(v.id, nivel)}
                  style={[
                    styles.nivel,
                    {
                      borderColor: occupancy[nivel].color,
                      backgroundColor: active
                        ? occupancy[nivel].color
                        : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.nivelText,
                      { color: active ? '#0B0B12' : occupancy[nivel].color },
                    ]}
                  >
                    {occupancy[nivel].label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Pressable
        style={styles.signOut}
        onPress={async () => {
          await signOut();
          router.replace('/');
        }}
      >
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </Pressable>
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
    gap: spacing.sm,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  muted: { color: colors.textMuted, fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  venueName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  nivelRow: { flexDirection: 'row', gap: spacing.sm },
  nivel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  nivelText: { fontWeight: '800', fontSize: 14 },
  link: { color: colors.primary, fontWeight: '700' },
  signOut: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutText: { color: colors.textMuted, fontWeight: '600' },
});
