import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EventoCard } from '@/components/EventoCard';
import { GaleriaAntro } from '@/components/GaleriaAntro';
import { fotosAprobadasDeAntro, obtenerAntro } from '@/data/antros';
import { listarEventosDeAntro } from '@/data/eventos';
import { listarResenasDeAntro, promedioEstrellas } from '@/data/resenas';
import { colors, font, radius, spacing } from '@/theme';
import type { Antro, Evento, Resena } from '@/types';

export default function AntroScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [antro, setAntro] = useState<Antro | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [fotos, setFotos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const [a, e, r, f] = await Promise.all([
        obtenerAntro(id),
        listarEventosDeAntro(id),
        listarResenasDeAntro(id),
        fotosAprobadasDeAntro(id),
      ]);
      setAntro(a);
      setEventos(e);
      setResenas(r);
      setFotos(f);
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

  const promedio = promedioEstrellas(resenas);
  const fotosResenas = resenas.filter((r) => r.fotoUrl).map((r) => r.fotoUrl as string);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <GaleriaAntro fotos={fotos.length > 0 ? fotos : antro.fotos} />
      <View style={styles.body}>
        <View style={styles.headRow}>
          <Text style={font.title}>{antro.nombre}</Text>
          {resenas.length > 0 ? (
            <View style={styles.rating}>
              <Text style={styles.ratingTxt}>★ {promedio.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({resenas.length})</Text>
            </View>
          ) : null}
        </View>
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

        {fotosResenas.length > 0 ? (
          <>
            <Text style={[font.h2, { marginTop: spacing.lg }]}>Fotos de quienes fueron</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galeria}>
              {fotosResenas.map((f, i) => (
                <Image key={i} source={{ uri: f }} style={styles.fotoResena} />
              ))}
            </ScrollView>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: spacing.xxl },
  body: { padding: spacing.lg, gap: spacing.xs },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rating: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  ratingTxt: { color: colors.accent, fontSize: 16, fontWeight: '800' },
  ratingCount: { color: colors.textFaint, fontSize: 12 },
  desc: { ...font.body, marginTop: spacing.sm, lineHeight: 22 },
  direccion: { color: colors.textFaint, fontSize: 13, marginTop: spacing.xs },
  eventos: { gap: spacing.md, marginTop: spacing.md },
  galeria: { gap: spacing.sm },
  fotoResena: { width: 110, height: 110, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
});
