import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { asignarPlan, listarCorporativos, PLANES } from '@/data/superadmin';
import { colors, font, radius, spacing } from '@/theme';
import type { CorporativoAdmin } from '@/types';

/** Planes y cobro: asignar tier de suscripción. Montos e integración: pendientes. */
export default function SaPlanesScreen() {
  const [corps, setCorps] = useState<CorporativoAdmin[]>(listarCorporativos());

  function cambiar(corpId: string, plan: string) {
    asignarPlan(corpId, plan);
    setCorps(listarCorporativos());
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.muted}>
        Asigna el nivel de suscripción por corporativo. Los montos y la integración de
        pagos quedan pendientes para una fase posterior; aquí está la estructura.
      </Text>
      {corps.map((c) => (
        <View key={c.id} style={styles.card}>
          <Text style={font.h3}>{c.nombre}</Text>
          <Text style={font.muted}>Plan actual: {c.plan}</Text>
          <View style={styles.planes}>
            {PLANES.map((p) => (
              <Pressable key={p} style={[styles.plan, c.plan === p && styles.planOn]} onPress={() => cambiar(c.id, p)}>
                <Text style={[styles.planTxt, c.plan === p && { color: colors.onAccent }]}>{p}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.estadoPago}>Estado de pago: al corriente (demo)</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  planes: { flexDirection: 'row', gap: spacing.sm },
  plan: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  planOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  planTxt: { color: colors.text, fontWeight: '800', fontSize: 13 },
  estadoPago: { color: colors.textFaint, fontSize: 12 },
});
