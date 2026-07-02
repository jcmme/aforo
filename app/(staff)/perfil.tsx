import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { DEMO_IDENTIDAD_POR_ROL, insigniasDeRP, listarRanking, metricasRP } from '@/data/social';
import { colors, font, radius, spacing } from '@/theme';
import type { InsigniaEstado, MetricasRP } from '@/types';

const ETIQUETA_ROL: Record<string, string> = { rp: 'RP', capitan: 'Capitán' };

/**
 * Perfil propio: insignias permanentes, posición y métricas propias. Sirve
 * tanto para RP como para capitán — se miden exactamente igual (CLAUDE.md §6).
 */
export default function PerfilScreen() {
  const { rolActivo } = useAuth();
  const creadorId = DEMO_IDENTIDAD_POR_ROL[rolActivo] ?? 'rp-ana';
  const rol = rolActivo === 'capitan' ? 'capitan' : 'rp';

  const [m, setM] = useState<MetricasRP | null>(null);
  const [insignias, setInsignias] = useState<InsigniaEstado[]>([]);
  const [posicion, setPosicion] = useState<number>(0);

  useEffect(() => {
    setM(metricasRP(creadorId));
    setInsignias(insigniasDeRP(creadorId, rol));
    setPosicion(listarRanking().find((e) => e.rpId === creadorId)?.posicion ?? 0);
  }, [creadorId, rol]);

  if (!m) return null;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <View style={styles.cab}>
        <Text style={font.title}>{m.nombre}</Text>
        <Text style={font.muted}>{ETIQUETA_ROL[rol]} · posición #{posicion} esta semana</Text>
      </View>

      {/* Métricas propias (cada quien ve las suyas). */}
      <View style={styles.metricas}>
        <Metrica valor={String(m.creadas)} etiqueta="Reservas" />
        <Metrica valor={String(m.completas)} etiqueta="Completas" />
        <Metrica valor={`${Math.round(m.showRate * 100)}%`} etiqueta="Show rate" />
        <Metrica valor={String(m.personas)} etiqueta="Personas" />
        <Metrica valor={String(m.noShows)} etiqueta="No-shows" />
        <Metrica valor={`$${(m.consumoSemana / 1000).toFixed(0)}k`} etiqueta="Consumo sem." />
      </View>

      <Text style={[font.h2, { marginTop: spacing.md }]}>Insignias</Text>
      <Text style={font.muted}>
        Logros permanentes. No se reinician.{' '}
        {rol === 'capitan' ? 'Metas ajustadas al rol de capitán.' : ''}
      </Text>
      <View style={styles.insignias}>
        {insignias.map((i) => (
          <View key={i.clave} style={[styles.insignia, !i.desbloqueada && styles.bloqueada]}>
            <View style={[styles.medalla, { backgroundColor: i.desbloqueada ? colors.accent : colors.surfaceAlt }]}>
              <Text style={[styles.medallaTxt, { color: i.desbloqueada ? colors.onAccent : colors.textFaint }]}>
                {i.nombre.slice(0, 1)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.insTitulo, !i.desbloqueada && { color: colors.textFaint }]}>{i.nombre}</Text>
              <Text style={styles.insDesc}>{i.descripcion}</Text>
            </View>
            <Text style={[styles.estado, { color: i.desbloqueada ? colors.success : colors.textFaint }]}>
              {i.desbloqueada ? 'Lograda' : 'Bloqueada'}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Metrica({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <View style={styles.metrica}>
      <Text style={styles.metricaVal}>{valor}</Text>
      <Text style={styles.metricaEt}>{etiqueta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  cab: { gap: 2, marginBottom: spacing.sm },
  metricas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metrica: { width: '31%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center', gap: 2 },
  metricaVal: { color: colors.text, fontSize: 22, fontWeight: '900' },
  metricaEt: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
  insignias: { gap: spacing.sm, marginTop: spacing.sm },
  insignia: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  bloqueada: { opacity: 0.6 },
  medalla: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  medallaTxt: { fontWeight: '900', fontSize: 18 },
  insTitulo: { color: colors.text, fontSize: 15, fontWeight: '800' },
  insDesc: { color: colors.textMuted, fontSize: 12 },
  estado: { fontSize: 11, fontWeight: '800' },
});
