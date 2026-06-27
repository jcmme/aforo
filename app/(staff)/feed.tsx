import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { construirFeed } from '@/data/social';
import { colors, font, radius, spacing } from '@/theme';
import type { FeedItem } from '@/types';

const COLOR_TIPO: Record<FeedItem['tipo'], string> = {
  insignia: colors.primary,
  ranking: '#F5C542',
  racha: colors.accent,
};

/** Feed de logros del staff. Muestra medallas y posiciones, nunca montos crudos. */
export default function FeedScreen() {
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    setFeed(construirFeed());
  }, []);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.kicker}>Red social del staff</Text>
      <Text style={font.title}>Logros</Text>
      {feed.map((f) => (
        <View key={f.id} style={styles.card}>
          <View style={[styles.punto, { backgroundColor: COLOR_TIPO[f.tipo] }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.texto}>
              <Text style={styles.nombre}>{f.rpNombre}</Text> {f.texto}
            </Text>
            <Text style={styles.cuando}>{f.cuando}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  card: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: spacing.xs },
  punto: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  texto: { color: colors.text, fontSize: 14, lineHeight: 20 },
  nombre: { fontWeight: '800' },
  cuando: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
});
