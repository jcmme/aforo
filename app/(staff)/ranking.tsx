import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { listarRanking } from '@/data/social';
import { colors, font, radius, spacing } from '@/theme';
import type { EntradaRanking } from '@/types';

// Cifras exactas solo de gerente hacia arriba (CLAUDE.md §6).
const VE_MONTOS = ['gerente', 'gerente_general', 'dueno', 'socio', 'super_admin'];

const MEDALLA: Record<number, { label: string; color: string }> = {
  1: { label: 'ORO', color: '#F5C542' },
  2: { label: 'PLATA', color: '#C7CBD1' },
  3: { label: 'BRONCE', color: '#C97B45' },
};

/** Ranking semanal de RPs por consumo (se reinicia cada semana). */
export default function RankingScreen() {
  const { rolActivo } = useAuth();
  const veMontos = VE_MONTOS.includes(rolActivo);
  const [ranking, setRanking] = useState<EntradaRanking[]>([]);

  useEffect(() => {
    setRanking(listarRanking());
  }, []);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.kicker}>Semanal · se reinicia</Text>
      <Text style={font.title}>Ranking de consumo</Text>
      <Text style={font.muted}>Por consumo generado en mesas reservadas (dato del cajero).</Text>

      {ranking.map((e) => {
        const medalla = MEDALLA[e.posicion];
        return (
          <View key={e.rpId} style={[styles.row, medalla && { borderColor: medalla.color }]}>
            <Text style={styles.pos}>{e.posicion}</Text>
            <View style={{ flex: 1 }}>
              <Text style={font.h3}>{e.nombre}</Text>
              {medalla ? (
                <Text style={[styles.medalla, { color: medalla.color }]}>
                  Medalla de {medalla.label.toLowerCase()}
                  {e.racha >= 2 ? ` · racha ${e.racha} sem` : ''}
                </Text>
              ) : (
                <Text style={font.muted}>Fuera del top 3</Text>
              )}
            </View>
            {veMontos ? (
              <Text style={styles.consumo}>${e.consumo.toLocaleString('es-MX')}</Text>
            ) : (
              <Text style={styles.medallaIcon}>{e.posicion <= 3 ? '●' : ''}</Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: spacing.xs },
  pos: { color: colors.textFaint, fontSize: 24, fontWeight: '900', width: 32, textAlign: 'center' },
  medalla: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  consumo: { color: colors.text, fontSize: 15, fontWeight: '800' },
  medallaIcon: { color: colors.primary, fontSize: 20, fontWeight: '900' },
});
