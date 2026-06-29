import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from '@/theme';

/**
 * Vista del cadenero: SOLO dos botones, pensada para operar a oscuras y rápido.
 * El cadenero ejecuta, no decide: no ve métricas ni nada más.
 */
export default function CadeneroScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.boton, styles.escanear, pressed && styles.press]}
        onPress={() => router.push('/(staff)/escanear')}
      >
        <Text style={styles.escanearTitulo}>Escanear QR</Text>
        <Text style={styles.escanearSub}>Cámara → semáforo</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.boton, styles.contador, pressed && styles.press]}
        onPress={() => router.push('/(staff)/contador')}
      >
        <Text style={styles.contadorTitulo}>Contador</Text>
        <Text style={styles.contadorSub}>Entradas sin reserva</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' },
  boton: { flex: 1, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  press: { opacity: 0.85 },
  escanear: { backgroundColor: colors.accent },
  contador: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  escanearTitulo: { fontSize: 34, fontWeight: '800', color: colors.onAccent, letterSpacing: -0.5 },
  escanearSub: { fontSize: 14, fontWeight: '600', color: 'rgba(10,10,12,0.7)' },
  contadorTitulo: { fontSize: 34, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  contadorSub: { ...font.muted },
});
