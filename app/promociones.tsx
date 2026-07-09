import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { PromoCard } from '@/components/PromoCard';
import { SeccionLabel } from '@/components/ui';
import { promocionesDisponibles } from '@/data/promociones';
import { colors, font, spacing } from '@/theme';
import type { PromoDisponible } from '@/types';

/**
 * Espacio definitivo de promociones (escaparate neutral, no pertenece a nadie).
 * Destacada en grande arriba, luego todas las disponibles en el mismo formato.
 * Cada una lleva a su antro dueño.
 */
export default function PromocionesScreen() {
  const router = useRouter();
  const [promos, setPromos] = useState<PromoDisponible[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      promocionesDisponibles()
        .then((data) => activo && setPromos(data))
        .finally(() => activo && setCargando(false));
      return () => {
        activo = false;
      };
    }, []),
  );

  const [destacada, ...resto] = promos;
  const irAntro = (antroId: string) => router.push(`/antro/${antroId}`);

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={resto}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={font.kicker}>Beneficios de reservar con AFORO</Text>
          <Text style={font.title}>Promociones</Text>
          {destacada ? (
            <View style={styles.heroWrap}>
              <PromoCard promo={destacada} variante="destacada" onPress={() => irAntro(destacada.antroId)} />
            </View>
          ) : null}
          {resto.length > 0 ? <SeccionLabel>Más para ti</SeccionLabel> : null}
        </View>
      }
      renderItem={({ item }) => (
        <PromoCard promo={item} onPress={() => irAntro(item.antroId)} />
      )}
      ListEmptyComponent={
        cargando ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
        ) : !destacada ? (
          <Text style={font.muted}>Por ahora no hay promociones disponibles.</Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  header: { gap: spacing.sm },
  heroWrap: { marginTop: spacing.sm, marginBottom: spacing.sm },
});
