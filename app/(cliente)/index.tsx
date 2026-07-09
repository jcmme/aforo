import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AntroCard } from '@/components/AntroCard';
import { PromoCard } from '@/components/PromoCard';
import { SeccionLabel } from '@/components/ui';
import { listarAntros } from '@/data/antros';
import { promocionesDisponibles } from '@/data/promociones';
import { colors, font, radius, spacing } from '@/theme';
import type { Antro, PromoDisponible } from '@/types';

export default function ExplorarScreen() {
  const router = useRouter();
  const [antros, setAntros] = useState<Antro[]>([]);
  const [promos, setPromos] = useState<PromoDisponible[]>([]);
  const [cargando, setCargando] = useState(true);

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

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={antros}
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
});
