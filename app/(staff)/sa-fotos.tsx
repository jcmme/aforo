import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FORMATO_FOTO_ANTRO, listarFotosPendientes, moderarFoto } from '@/data/antros';
import { colors, familias, font, radius, spacing } from '@/theme';
import type { FotoAntro } from '@/types';

/**
 * Cola de aprobación de fotos (EXCLUSIVA del Súper Admin). Los antros suben sus
 * fotos; aquí se aprueban o rechazan antes de que el cliente las vea. Se
 * recuerda el formato estándar que deben cumplir.
 */
export default function SaFotosScreen() {
  const [pendientes, setPendientes] = useState<FotoAntro[]>([]);

  const cargar = useCallback(() => {
    listarFotosPendientes().then(setPendientes);
  }, []);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function decidir(id: string, aprobar: boolean) {
    await moderarFoto(id, aprobar);
    cargar();
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.muted}>
        Cada foto que suben los antros pasa por aquí antes de mostrarse. Formato
        requerido: {FORMATO_FOTO_ANTRO.proporcion}, {FORMATO_FOTO_ANTRO.recomendado}
        {' '}({FORMATO_FOTO_ANTRO.tipo}, máx. {FORMATO_FOTO_ANTRO.pesoMax}).
      </Text>

      {pendientes.length === 0 ? (
        <Text style={[font.muted, { marginTop: spacing.lg }]}>No hay fotos pendientes.</Text>
      ) : (
        pendientes.map((f) => (
          <View key={f.id} style={styles.card}>
            <Image source={{ uri: f.url }} style={styles.foto} resizeMode="cover" />
            <Text style={styles.antro}>{f.antroNombre}</Text>
            <View style={styles.acciones}>
              <Pressable
                style={({ pressed }) => [styles.btn, styles.rechazar, pressed && styles.press]}
                onPress={() => decidir(f.id, false)}
              >
                <Text style={styles.rechazarTxt}>Rechazar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.btn, styles.aprobar, pressed && styles.press]}
                onPress={() => decidir(f.id, true)}
              >
                <Text style={styles.aprobarTxt}>Aprobar</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    padding: spacing.md,
    gap: spacing.sm,
  },
  foto: { width: '100%', aspectRatio: FORMATO_FOTO_ANTRO.aspectRatio, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  antro: { color: colors.text, fontFamily: familias.medium, fontSize: 15 },
  acciones: { flexDirection: 'row', gap: spacing.sm },
  btn: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  press: { opacity: 0.7 },
  rechazar: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(224,105,107,0.4)' },
  rechazarTxt: { color: colors.danger, fontFamily: familias.medium, fontSize: 14 },
  aprobar: { backgroundColor: colors.accent },
  aprobarTxt: { color: colors.onAccent, fontFamily: familias.semi, fontSize: 14 },
});
