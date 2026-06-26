import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton, Campo, Pantalla } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, font, spacing } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { iniciarSesion, demo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function entrar() {
    setError(null);
    setCargando(true);
    try {
      await iniciarSesion(email.trim(), password);
      router.replace('/(cliente)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Pantalla>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Text style={font.kicker}>Vida nocturna</Text>
          <Text style={styles.logo}>AFORO</Text>
          <Text style={font.muted}>Reserva, comparte tu acceso y entra sin filas.</Text>
        </View>

        {demo ? (
          <Text style={styles.demo}>Modo demo: cualquier correo y contraseña funcionan.</Text>
        ) : null}

        <View style={styles.form}>
          <Campo
            etiqueta="Correo"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Campo
            etiqueta="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Boton titulo="Entrar" onPress={entrar} cargando={cargando} />
        </View>

        <View style={styles.footer}>
          <Text style={font.muted}>¿No tienes cuenta?</Text>
          <Link href="/(auth)/registro" style={styles.link}>
            Crear cuenta
          </Link>
        </View>
      </ScrollView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.xl, flexGrow: 1, justifyContent: 'center' },
  brand: { gap: spacing.xs, alignItems: 'flex-start' },
  logo: { fontSize: 44, fontWeight: '900', color: colors.text, letterSpacing: 2 },
  demo: { color: colors.primary, fontSize: 13 },
  form: { gap: spacing.md },
  error: { color: colors.danger, fontSize: 13 },
  footer: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '800' },
});
