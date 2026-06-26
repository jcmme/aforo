import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Boton, Pantalla } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, font, spacing } from '@/theme';

/**
 * Verificación de correo y teléfono (CLAUDE.md §3). El correo se verifica con
 * el enlace que envía Supabase Auth; el teléfono requiere un proveedor de SMS
 * (p. ej. Twilio) — aquí queda el flujo listo y se completa al integrarlo.
 */
export default function VerificarScreen() {
  const router = useRouter();
  const { usuario } = useAuth();

  return (
    <Pantalla>
      <View style={styles.content}>
        <Text style={font.kicker}>Casi listo</Text>
        <Text style={styles.title}>Verifica tu cuenta</Text>

        <View style={styles.lista}>
          <Fila
            ok={usuario?.emailVerificado ?? false}
            titulo="Correo"
            detalle="Te enviamos un enlace de confirmación a tu correo."
          />
          <Fila
            ok={usuario?.telefonoVerificado ?? false}
            titulo="Teléfono"
            detalle="Verificación por SMS (se activa al integrar el proveedor)."
          />
        </View>

        <Text style={font.muted}>
          Puedes explorar mientras tanto; algunas acciones pedirán verificar primero.
        </Text>
        <Boton titulo="Continuar" onPress={() => router.replace('/(cliente)')} />
      </View>
    </Pantalla>
  );
}

function Fila({ ok, titulo, detalle }: { ok: boolean; titulo: string; detalle: string }) {
  return (
    <View style={styles.fila}>
      <View style={[styles.check, { borderColor: ok ? colors.success : colors.border }]}>
        <Text style={{ color: ok ? colors.success : colors.textFaint, fontWeight: '900' }}>
          {ok ? '✓' : '•'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={font.h3}>{titulo}</Text>
        <Text style={font.muted}>{detalle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.xl, gap: spacing.lg, justifyContent: 'center' },
  title: font.title,
  lista: { gap: spacing.md },
  fila: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
