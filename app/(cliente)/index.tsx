import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AntroCard } from '@/components/AntroCard';
import { PromoCard } from '@/components/PromoCard';
import { SeccionLabel } from '@/components/ui';
import { listarAntros } from '@/data/antros';
import { promocionesDisponibles } from '@/data/promociones';
import { colors, familias, font, radius, spacing } from '@/theme';
import type { Antro, PromoDisponible } from '@/types';

export default function ExplorarScreen() {
  const router = useRouter();
  const [antros, setAntros] = useState<Antro[]>([]);
  const [promos, setPromos] = useState<PromoDisponible[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [zona, setZona] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      Promise.all([listarAntros(), promocionesDisponibles()])
        .then(([a, p]) => {
          if (!activo) return;
          setAntros(a);
          setPromos(p);
        })
        .finally(() => activo && setCargando(false));
      return () => {
        activo = false;
      };
    }, []),
  );

  const destacada = promos[0];

  const zonas = useMemo(
    () => Array.from(new Set(antros.map((a) => a.zona))).sort((a, b) => a.localeCompare(b)),
    [antros],
  );

  const antrosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return antros.filter((a) => {
      if (zona && a.zona !== zona) return false;
      if (!q) return true;
      return (
        a.nombre.toLowerCase().includes(q) ||
        a.zona.toLowerCase().includes(q) ||
        (a.descripcion ?? '').toLowerCase().includes(q)
      );
    });
  }, [antros, busqueda, zona]);

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={antrosFiltrados}
      keyExtractor={(a) => a.id}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={font.kicker}>Esta noche en Puebla</Text>
          <Text style={font.title}>¿A dónde vamos?</Text>

          {destacada ? (
            <View style={styles.promos}>
              <SeccionLabel>Promociones</SeccionLabel>
              <PromoCard
                promo={destacada}
                variante="destacada"
                onPress={() => router.push(`/antro/${destacada.antroId}`)}
              />
              <Pressable
                style={({ pressed }) => [styles.verTodas, pressed && styles.verTodasPress]}
                onPress={() => router.push('/promociones')}
              >
                <Text style={styles.verTodasTxt}>
                  Ver todas las promociones{promos.length > 1 ? ` · ${promos.length}` : ''}
                </Text>
                <Text style={styles.verTodasFlecha}>→</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.buscador}>
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar por nombre o zona"
              placeholderTextColor={colors.textFaint}
              style={styles.buscadorInput}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>

          {zonas.length > 1 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={['Todas', ...zonas]}
              keyExtractor={(z) => z}
              contentContainerStyle={styles.chips}
              renderItem={({ item: z }) => {
                const activo = z === 'Todas' ? zona === null : zona === z;
                return (
                  <Pressable
                    style={[styles.chip, activo && styles.chipActivo]}
                    onPress={() => setZona(z === 'Todas' ? null : z)}
                  >
                    <Text style={[styles.chipTxt, activo && styles.chipTxtActivo]}>{z}</Text>
                  </Pressable>
                );
              }}
            />
          ) : null}

          <View style={styles.antrosLabel}>
            <SeccionLabel>Antros</SeccionLabel>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <AntroCard antro={item} onPress={() => router.push(`/antro/${item.id}`)} />
      )}
      ListEmptyComponent={
        cargando ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
        ) : antros.length > 0 ? (
          <Text style={font.muted}>Nada coincide con tu búsqueda.</Text>
        ) : (
          <Text style={font.muted}>No hay antros disponibles.</Text>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  header: { gap: spacing.sm, marginBottom: spacing.xs },
  promos: { gap: spacing.sm, marginTop: spacing.md },
  verTodas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  verTodasPress: { opacity: 0.6 },
  verTodasTxt: { color: colors.text, fontFamily: font.h3.fontFamily, fontSize: 14 },
  verTodasFlecha: { color: colors.accent, fontSize: 16 },
  antrosLabel: { marginTop: spacing.lg },
  buscador: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  buscadorInput: {
    color: colors.text,
    fontFamily: familias.regular,
    fontSize: 15,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  chips: { gap: spacing.sm, marginTop: spacing.md },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActivo: { borderColor: colors.accent, backgroundColor: colors.accent },
  chipTxt: { color: colors.textMuted, fontFamily: familias.medium, fontSize: 12 },
  chipTxtActivo: { color: colors.onAccent },
});
