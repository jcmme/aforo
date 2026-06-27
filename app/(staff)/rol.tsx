import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { colors, font, radius, spacing } from '@/theme';
import type { Rol } from '@/types';

const ROLES: { rol: Rol; titulo: string; detalle: string }[] = [
  { rol: 'cadenero', titulo: 'Cadenero', detalle: 'Puerta: escanear QR y contador. Vista mínima.' },
  { rol: 'hostess', titulo: 'Hostess', detalle: 'Escaneo de puerta y asignación/movimiento de mesa.' },
  { rol: 'capitan', titulo: 'Capitán', detalle: 'Escaneo de mesa, acuse de promo y consumo mínimo.' },
  { rol: 'cliente', titulo: 'Cliente', detalle: 'Volver a la app del cliente.' },
];

/** Selector de rol SOLO para demo (en real, el rol sale de las membresías). */
export default function RolScreen() {
  const router = useRouter();
  const { cambiarRolDemo } = useAuth();

  function elegir(rol: Rol) {
    cambiarRolDemo(rol);
    router.replace('/');
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.kicker}>Modo demo</Text>
      <Text style={font.title}>Ver la app como…</Text>
      <Text style={font.muted}>
        En producción, cada persona ve solo su rol (asignado por invitación). Aquí
        puedes recorrer cada vista del personal.
      </Text>

      {ROLES.map((r) => (
        <Pressable key={r.rol} style={styles.card} onPress={() => elegir(r.rol)}>
          <Text style={styles.titulo}>{r.titulo}</Text>
          <Text style={font.muted}>{r.detalle}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  titulo: { ...font.h3, color: colors.primary },
});
