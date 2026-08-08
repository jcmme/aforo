import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/ui';
import { aprobarTyc, listarPendientesTyc } from '@/data/tyc';
import { colors, font, radius, spacing } from '@/theme';
import type { TycAntro } from '@/types';

/** Cola de aprobación de T&C (exclusiva del Súper Admin). */
export default function SaTycScreen() {
  const [pendientes, setPendientes] = useState<TycAntro[]>(listarPendientesTyc());
  const [aprobando, setAprobando] = useState<string | null>(null);

  async function aprobar(antroId: string) {
    setAprobando(antroId);
    await aprobarTyc(antroId);
    setPendientes(listarPendientesTyc());
    setAprobando(null);
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.muted}>
        Todo cambio de T&C de un antro requiere tu visto bueno. El corte semanal es
        martes 12:00 (editable en Parámetros): si apruebas antes, aplica esta semana;
        si es después, se pospone a la siguiente.
      </Text>
      {pendientes.length === 0 ? (
        <Text style={font.muted}>No hay cambios pendientes de aprobación.</Text>
      ) : (
        pendientes.map((t) => (
          <View key={t.antroId} style={styles.card}>
            <Text style={font.h3}>{t.antroId}</Text>
            <Text style={styles.label}>Responsable</Text>
            <Text style={font.body}>{t.responsableNombre ?? '—'}</Text>
            <Text style={styles.label}>Vigente</Text>
            <Text style={font.muted}>{t.textoVigente}</Text>
            <Text style={styles.label}>Propuesto</Text>
            <Text style={font.body}>{t.textoPendiente}</Text>
            <Boton titulo="Aprobar" onPress={() => aprobar(t.antroId)} cargando={aprobando === t.antroId} />
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 4 },
  label: { ...font.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.xs },
});
