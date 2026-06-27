import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { listarAuditoria } from '@/data/superadmin';
import { colors, font, radius, spacing } from '@/theme';

/** Bitácora global de auditoría (todos los corporativos). Soporte y trazabilidad. */
export default function SaAuditoriaScreen() {
  const items = listarAuditoria();
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.muted}>
        Toda acción sensible queda registrada con actor, corporativo y hora. La función
        "ver como" para depurar también se registraría aquí.
      </Text>
      {items.map((a) => (
        <View key={a.id} style={styles.card}>
          <View style={styles.head}>
            <Text style={styles.accion}>{a.accion}</Text>
            <Text style={styles.hora}>
              {new Date(a.cuando).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={font.muted}>{a.actor} · {a.corporativo}{a.entidad ? ` · ${a.entidad}` : ''}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accion: { color: colors.accent, fontWeight: '800', fontSize: 13 },
  hora: { color: colors.textFaint, fontSize: 12 },
});
