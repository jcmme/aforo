import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { DEMO_IDENTIDAD_POR_ROL, construirFeed, reaccionar } from '@/data/social';
import { colors, font, radius, spacing } from '@/theme';
import type { FeedEvento } from '@/types';

/** Iniciales para el avatar (sin fotos de perfil todavía; sin emoji). */
function iniciales(nombre: string): string {
  return nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

/**
 * Feed social del staff, formato tipo X: timeline vertical, tarjetas con
 * avatar + texto + interacciones (reacción y comentarios) al pie.
 */
export default function FeedScreen() {
  const router = useRouter();
  const { rolActivo } = useAuth();
  const miId = DEMO_IDENTIDAD_POR_ROL[rolActivo] ?? null;
  const [feed, setFeed] = useState<FeedEvento[]>([]);

  function recargar() {
    setFeed(construirFeed(miId));
  }

  useEffect(() => {
    recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolActivo]);

  function toggleReaccion(id: string) {
    if (!miId) return;
    reaccionar(id, miId);
    recargar();
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.kicker}>Red social del staff</Text>
      <Text style={font.title}>Logros</Text>
      {feed.map((ev) => (
        <View key={ev.id} style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{iniciales(ev.autorNombre)}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.texto}>
              <Text style={styles.nombre}>{ev.autorNombre}</Text> {ev.texto}
            </Text>
            <Text style={styles.cuando}>
              {new Date(ev.creadoEn).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
            </Text>
            <View style={styles.acciones}>
              <Pressable style={styles.accion} onPress={() => toggleReaccion(ev.id)} hitSlop={8}>
                <Text style={[styles.accionTxt, ev.reaccionadoPorMi && styles.accionTxtOn]}>
                  ♥ {ev.reacciones > 0 ? ev.reacciones : ''}
                </Text>
              </Pressable>
              <Pressable style={styles.accion} onPress={() => router.push(`/(staff)/feed-post/${ev.id}`)} hitSlop={8}>
                <Text style={styles.accionTxt}>
                  Comentar {ev.comentarios.length > 0 ? `(${ev.comentarios.length})` : ''}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  card: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: spacing.xs },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: colors.accent, fontWeight: '800', fontSize: 12 },
  texto: { color: colors.text, fontSize: 14, lineHeight: 20 },
  nombre: { fontWeight: '800' },
  cuando: { color: colors.textFaint, fontSize: 12 },
  acciones: { flexDirection: 'row', gap: spacing.lg, marginTop: 4 },
  accion: {},
  accionTxt: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  accionTxtOn: { color: colors.accent },
});
