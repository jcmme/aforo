import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { obtenerNotifSwitches, saludProducto, toggleNotifSwitch } from '@/data/superadmin';
import { colors, font, radius, spacing } from '@/theme';
import type { SaludCorporativo } from '@/types';

/** Salud del producto: adopción/actividad por corporativo + switches de notif. */
export default function SaSaludScreen() {
  const [salud] = useState<SaludCorporativo[]>(saludProducto());
  const [switches, setSwitches] = useState(obtenerNotifSwitches());

  function toggle(clave: 'posible_fantasma' | 'cupo_alcanzado') {
    toggleNotifSwitch(clave);
    setSwitches(obtenerNotifSwitches());
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={styles.seccion}>Adopción por corporativo</Text>
      <Text style={font.muted}>Penetración medida por el contador del cadenero (con reserva vs sin).</Text>
      {salud.map((s) => (
        <View key={s.corporativoId} style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={font.h3}>{s.nombre}</Text>
            <Text style={font.muted}>{s.reservas} reservas · {s.activo ? 'activo' : 'suspendido'}</Text>
          </View>
          <View style={styles.adopBox}>
            <Text style={styles.adop}>{s.adopcionPct}%</Text>
            <Text style={styles.adopEt}>adopción</Text>
          </View>
        </View>
      ))}

      <Text style={styles.seccion}>Notificaciones del gerente (configurables)</Text>
      <Text style={font.muted}>Apagadas por defecto.</Text>
      <View style={styles.switchRow}>
        <Text style={font.body}>Posible fantasma (cliente cae en su límite)</Text>
        <Switch value={switches.posible_fantasma} onValueChange={() => toggle('posible_fantasma')} trackColor={{ true: colors.primary, false: colors.border }} />
      </View>
      <View style={styles.switchRow}>
        <Text style={font.body}>Cupo del antro alcanzado</Text>
        <Switch value={switches.cupo_alcanzado} onValueChange={() => toggle('cupo_alcanzado')} trackColor={{ true: colors.primary, false: colors.border }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  seccion: { ...font.h2, marginTop: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  adopBox: { alignItems: 'center' },
  adop: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  adopEt: { color: colors.textFaint, fontSize: 10, textTransform: 'uppercase' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
});
