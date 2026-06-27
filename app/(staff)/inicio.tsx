import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MenuRol } from '@/components/MenuRol';
import { useAuth } from '@/context/AuthContext';
import { colors, font, spacing } from '@/theme';

const TITULO_ROL: Record<string, string> = {
  hostess: 'Hostess',
  capitan: 'Capitán',
  cajero: 'Cajero',
  rp: 'RP',
  gerente: 'Gerente',
};

/** Home del personal: tablero de tarjetas según el rol activo. */
export default function InicioStaff() {
  const { rolActivo, usuario } = useAuth();

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={font.kicker}>{TITULO_ROL[rolActivo] ?? 'Personal'}</Text>
        <Text style={font.title}>Hola, {usuario?.nombre ?? 'equipo'}</Text>
        <Text style={font.muted}>Elige una función.</Text>
      </View>
      <MenuRol rol={rolActivo} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: spacing.xs },
});
