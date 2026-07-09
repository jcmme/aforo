import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { listarFantasmas } from '@/data/fantasmas';
import { colors, font, radius, spacing } from '@/theme';
import type { AccionFantasma, ClienteFantasma } from '@/types';

const ACCION: Record<AccionFantasma, { label: string; color: string }> = {
  alerta: { label: 'Alerta', color: colors.warning },
  limite: { label: 'Límite de reservas', color: '#F97316' },
  bloqueo: { label: 'Bloqueo', color: colors.danger },
};

/** Panel de detección de fantasmas. Alimenta el panel Cadena (Sección 4). */
export default function FantasmasScreen() {
  const [lista, setLista] = useState<ClienteFantasma[]>([]);

  useEffect(() => {
    setLista(listarFantasmas());
  }, []);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.kicker}>El diferenciador</Text>
      <Text style={font.title}>Detección de fantasmas</Text>
      <Text style={font.muted}>
        No-show = QR distribuido que nunca llegó a puerta. La huella vincula reservas por
        teléfono aunque cambie el nombre. Umbral editable desde Súper Admin.
      </Text>

      {lista.map((c) => {
        const acc = ACCION[c.accion];
        return (
          <View key={c.identidad} style={[styles.card, { borderColor: acc.color }]}>
            <View style={styles.head}>
              <View style={{ flex: 1 }}>
                <Text style={font.h3}>{c.nombres.join(' / ')}</Text>
                <Text style={font.muted}>{c.telefono}</Text>
              </View>
              <View style={styles.scoreBox}>
                <Text style={[styles.score, { color: acc.color }]}>{c.score}</Text>
                <Text style={styles.scoreEt}>score</Text>
              </View>
            </View>

            <View style={styles.stats}>
              <Text style={styles.stat}>{c.reservas} reservas</Text>
              <Text style={styles.stat}>{c.noShows} no-shows</Text>
              <Text style={styles.stat}>{Math.round(c.showRate * 100)}% asistencia</Text>
            </View>

            {c.alertas.map((a) => (
              <Text key={a} style={styles.alerta}>• {a}</Text>
            ))}

            <View style={[styles.accion, { backgroundColor: acc.color }]}>
              <Text style={styles.accionTxt}>Acción sugerida: {acc.label}</Text>
            </View>
          </View>
        );
      })}

      <Text style={styles.nota}>
        El depósito en garantía queda contemplado para una fase posterior.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1.5, padding: spacing.md, gap: spacing.sm, marginTop: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scoreBox: { alignItems: 'center' },
  score: { fontSize: 28, fontWeight: '900' },
  scoreEt: { color: colors.textFaint, fontSize: 10, textTransform: 'uppercase' },
  stats: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  stat: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  alerta: { color: colors.text, fontSize: 13 },
  accion: { borderRadius: radius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: 'center', marginTop: spacing.xs },
  accionTxt: { color: colors.onAccent, fontWeight: '800', fontSize: 13 },
  nota: { color: colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: spacing.md },
});
