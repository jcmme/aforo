import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EventoCard } from '@/components/EventoCard';
import { obtenerAntro } from '@/data/antros';
import { listarEventosDeAntro } from '@/data/eventos';
import { colors, font, spacing } from '@/theme';
import type { Antro, Evento } from '@/types';

export default function AntroScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [antro, setAntro] = useState<Antro | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const [a, e] = await Promise.all([obtenerAntro(id), listarEventosDeAntro(id)]);
      setAntro(a);
      setEventos(e);
      setCargando(false);
    })();
  }, [id]);

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!antro) {
    return (
      <View style={styles.center}>
        <Text style={font.muted}>Antro no encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Image source={{ uri: antro.fotos[0] }} style={styles.hero} resizeMode="cover" />
      <View style={styles.body}>
        <Text style={font.title}>{antro.nombre}</Text>
        <Text style={font.muted}>
          {antro.zona} · {antro.horario}
        </Text>
        {antro.descripcion ? <Text style={styles.desc}>{antro.descripcion}</Text> : null}
        <Text style={styles.direccion}>{antro.direccion}</Text>

        <Text style={[font.h2, { marginTop: spacing.lg }]}>Próximos eventos</Text>
        <View style={styles.eventos}>
          {eventos.length === 0 ? (
            <Text style={font.muted}>Sin eventos próximos.</Text>
          ) : (
            eventos.map((e) => (
              <EventoCard key={e.id} evento={e} onPress={() => router.push(`/evento/${e.id}`)} />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: spacing.xxl },
  hero: { width: '100%', height: 240, backgroundColor: colors.surfaceAlt },
  body: { padding: spacing.lg, gap: spacing.xs },
  desc: { ...font.body, marginTop: spacing.sm, lineHeight: 22 },
  direccion: { color: colors.textFaint, fontSize: 13, marginTop: spacing.xs },
  eventos: { gap: spacing.md, marginTop: spacing.md },
});
