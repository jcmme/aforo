import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Boton, Pantalla } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, font, spacing } from '@/theme';

/**
 * Verificación de cuenta (CLAUDE.md §3): solo por correo, vía el enlace que
 * envía Supabase Auth. Justo después de registrarse todavía no hay sesión
 * (Supabase la abre hasta que el enlace se confirma), así que aquí se pide
 * el email por parámetro en vez de leerlo de `usuario`.
 */
export default function VerificarScreen() {
  const router = useRouter();
  const { usuario, reenviarConfirmacion } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = usuario?.email ?? params.email ?? '';
  const [reenviando, setReenviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function reenviar() {
    setMensaje(null);
    setReenviando(true);
    try {
      await reenviarConfirmacion(email);
      setMensaje('Listo, te lo volvimos a enviar.');
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudo reenviar el correo.');
    } finally {
      setReenviando(false);
    }
  }

  // Caso normal: se registró y todavía no hay sesión (falta confirmar el
  // correo). Se manda a iniciar sesión, que solo funcionará una vez confirmado.
  if (!usuario) {
    return (
      <Pantalla>
        <View style={styles.content}>
          <Text style={font.kicker}>Casi listo</Text>
          <Text style={styles.title}>Revisa tu correo</Text>
          <Text style={font.muted}>
            Te enviamos un enlace de confirmación a{' '}
            <Text style={styles.email}>{email || 'tu correo'}</Text>. Ábrelo y
            luego regresa aquí para iniciar sesión.
          </Text>

          {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}

          <Boton titulo="Ya confirmé, iniciar sesión" onPress={() => router.replace('/(auth)/login')} />
          <Boton
            titulo="Reenviar correo"
            variante="secundario"
            cargando={reenviando}
            onPress={reenviar}
          />
        </View>
      </Pantalla>
    );
  }

  // Caso poco común: ya hay sesión (p. ej. el proyecto no exige confirmar
  // correo). Se muestra el estado y se deja continuar de una vez.
  return (
    <Pantalla>
      <View style={styles.content}>
        <Text style={font.kicker}>Casi listo</Text>
        <Text style={styles.title}>Verifica tu cuenta</Text>

        <View style={styles.fila}>
          <View style={[styles.check, { borderColor: usuario.emailVerificado ? colors.success : colors.border }]}>
            <Text style={{ color: usuario.emailVerificado ? colors.success : colors.textFaint, fontWeight: '900' }}>
              {usuario.emailVerificado ? '✓' : '•'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={font.h3}>Correo</Text>
            <Text style={font.muted}>Te enviamos un enlace de confirmación a tu correo.</Text>
          </View>
        </View>

        <Text style={font.muted}>
          Puedes explorar mientras tanto; algunas acciones pedirán verificar primero.
        </Text>
        <Boton titulo="Continuar" onPress={() => router.replace('/(cliente)')} />
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.xl, gap: spacing.lg, justifyContent: 'center' },
  title: font.title,
  email: { color: colors.text, fontWeight: '700' },
  mensaje: { color: colors.success, fontSize: 13 },
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
