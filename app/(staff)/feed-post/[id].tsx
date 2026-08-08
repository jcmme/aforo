import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton, Campo } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { DEMO_IDENTIDAD_POR_ROL, comentar, obtenerFeedEvento, reaccionar } from '@/data/social';
import { colors, font, radius, spacing } from '@/theme';
import type { FeedEvento } from '@/types';

const NOMBRE_ROL: Record<string, string> = { rp: 'RP', capitan: 'Capitán', gerente: 'Gerente' };

/** Detalle de una publicación del feed: texto completo + hilo de comentarios. */
export default function FeedPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rolActivo, usuario } = useAuth();
  const miId = DEMO_IDENTIDAD_POR_ROL[rolActivo] ?? null;
  const [ev, setEv] = useState<FeedEvento | null>(null);
  const [texto, setTexto] = useState('');

  function recargar() {
    setEv(obtenerFeedEvento(id, miId));
  }

  useEffect(recargar, [id]);

  function enviarComentario() {
    if (!texto.trim()) return;
    comentar(id, usuario?.nombre ?? NOMBRE_ROL[rolActivo] ?? 'Staff', texto);
    setTexto('');
    recargar();
  }

  if (!ev) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
        <View style={styles.post}>
          <Text style={styles.texto}>
            <Text style={styles.nombre}>{ev.autorNombre}</Text> {ev.texto}
          </Text>
          <Text style={font.muted}>
            {new Date(ev.creadoEn).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text
            style={[styles.reaccion, ev.reaccionadoPorMi && styles.reaccionOn]}
            onPress={() => { if (miId) { reaccionar(ev.id, miId); recargar(); } }}
          >
            ♥ {ev.reacciones > 0 ? ev.reacciones : 'Reaccionar'}
          </Text>
        </View>

        <Text style={styles.label}>Comentarios</Text>
        {ev.comentarios.length === 0 ? <Text style={font.muted}>Sé el primero en comentar.</Text> : null}
        {ev.comentarios.map((c) => (
          <View key={c.id} style={styles.comentario}>
            <Text style={styles.comentarioTexto}>
              <Text style={styles.nombre}>{c.autorNombre}</Text> {c.texto}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Campo value={texto} onChangeText={setTexto} placeholder="Escribe un comentario…" />
        </View>
        <Boton titulo="Enviar" onPress={enviarComentario} deshabilitado={!texto.trim()} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
  post: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm },
  texto: { color: colors.text, fontSize: 16, lineHeight: 22 },
  nombre: { fontWeight: '800' },
  reaccion: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  reaccionOn: { color: colors.accent },
  label: { ...font.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.md },
  comentario: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
  comentarioTexto: { color: colors.text, fontSize: 14 },
  footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'flex-end' },
});
