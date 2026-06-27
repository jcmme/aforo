import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { listarCorporativos, suspenderCorporativo, toggleFeatureFlag } from '@/data/superadmin';
import { colors, font, radius, spacing } from '@/theme';
import type { CorporativoAdmin } from '@/types';

/** Corporativos y antros: alta/baja, feature flags, suspender por impago. */
export default function SaCorporativosScreen() {
  const [corps, setCorps] = useState<CorporativoAdmin[]>(listarCorporativos());
  const refrescar = () => setCorps(listarCorporativos());

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.muted}>Aislamiento estricto: cada corporativo es independiente. Suspender corta el acceso por impago.</Text>
      {corps.map((c) => (
        <View key={c.id} style={styles.card}>
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={font.h3}>{c.nombre}</Text>
              <Text style={font.muted}>{c.antros} antros · plan {c.plan}</Text>
            </View>
            <View style={[styles.estado, { backgroundColor: c.activo ? colors.success : colors.danger }]}>
              <Text style={styles.estadoTxt}>{c.activo ? 'Activo' : 'Suspendido'}</Text>
            </View>
          </View>

          <Text style={styles.label}>Módulos (feature flags)</Text>
          {c.featureFlags.map((f) => (
            <View key={f.clave} style={styles.flagRow}>
              <Text style={font.body}>{f.clave}</Text>
              <Switch
                value={f.habilitado}
                onValueChange={() => { toggleFeatureFlag(c.id, f.clave); refrescar(); }}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>
          ))}

          <Pressable
            style={[styles.suspender, { borderColor: c.activo ? colors.danger : colors.success }]}
            onPress={() => { suspenderCorporativo(c.id, !c.activo); refrescar(); }}
          >
            <Text style={[styles.suspenderTxt, { color: c.activo ? colors.danger : colors.success }]}>
              {c.activo ? 'Suspender por impago' : 'Reactivar'}
            </Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  estado: { paddingVertical: 4, paddingHorizontal: spacing.sm, borderRadius: radius.pill },
  estadoTxt: { color: '#04141A', fontWeight: '800', fontSize: 11 },
  label: { ...font.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.xs },
  flagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  suspender: { borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.xs },
  suspenderTxt: { fontWeight: '800', fontSize: 13 },
});
