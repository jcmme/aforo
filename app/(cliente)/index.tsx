import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { AntroCard } from '@/components/AntroCard';
import { listarAntros } from '@/data/antros';
import { colors, font, spacing } from '@/theme';
import type { Antro } from '@/types';

export default function ExplorarScreen() {
  const router = useRouter();
  const [antros, setAntros] = useState<Antro[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      listarAntros()
        .then((data) => activo && setAntros(data))
        .finally(() => activo && setCargando(false));
      return () => {
        activo = false;
      };
    }, []),
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={antros}
      keyExtractor={(a) => a.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={font.kicker}>Esta noche en Puebla</Text>
          <Text style={font.title}>¿A dónde vamos?</Text>
        </View>
      }
      renderItem={({ item }) => (
        <AntroCard antro={item} onPress={() => router.push(`/antro/${item.id}`)} />
      )}
      ListEmptyComponent={
        cargando ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <Text style={font.muted}>No hay antros disponibles.</Text>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
});
