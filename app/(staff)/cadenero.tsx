import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, gradients, radius, spacing } from '@/theme';

/**
 * Vista del cadenero: SOLO dos botones, pensada para operar a oscuras y rápido.
 * El cadenero ejecuta, no decide: no ve métricas ni nada más.
 */
export default function CadeneroScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Pressable style={styles.botonWrap} onPress={() => router.push('/(staff)/escanear')}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.boton}
        >
          <Text style={styles.botonTitulo}>Escanear QR</Text>
          <Text style={styles.botonSub}>Cámara → semáforo</Text>
        </LinearGradient>
      </Pressable>

      <Pressable style={[styles.botonWrap, styles.contador]} onPress={() => router.push('/(staff)/contador')}>
        <Text style={styles.botonTituloDark}>Contador</Text>
        <Text style={styles.botonSubDark}>Entradas sin reserva</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' },
  botonWrap: { flex: 1, borderRadius: radius.xl, overflow: 'hidden' },
  boton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  contador: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  botonTitulo: { fontSize: 32, fontWeight: '900', color: '#04141A' },
  botonSub: { fontSize: 14, fontWeight: '700', color: 'rgba(4,20,26,0.7)' },
  botonTituloDark: { fontSize: 32, fontWeight: '900', color: colors.text },
  botonSubDark: { ...font.muted },
});
