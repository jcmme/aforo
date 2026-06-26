import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing } from '@/theme';
import type { UserRole } from '@/types';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, demo } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<UserRole>('cliente');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signUp(email.trim(), password, nombre.trim(), rol);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

      {demo && (
        <Text style={styles.demo}>
          Modo demo: el registro no persiste, sólo simula la sesión.
        </Text>
      )}

      <Text style={styles.label}>Soy…</Text>
      <View style={styles.roleRow}>
        {(['cliente', 'venue_staff'] as UserRole[]).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRol(r)}
            style={[styles.role, rol === r && styles.roleActive]}
          >
            <Text style={[styles.roleText, rol === r && styles.roleTextActive]}>
              {r === 'cliente' ? 'Cliente' : 'Venue'}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder={rol === 'venue_staff' ? 'Nombre del lugar' : 'Tu nombre'}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Correo"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        style={styles.input}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Crear cuenta</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  demo: { color: colors.primary, fontSize: 13 },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleRow: { flexDirection: 'row', gap: spacing.sm },
  role: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  roleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleText: { color: colors.textMuted, fontWeight: '700' },
  roleTextActive: { color: '#fff' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: { color: colors.lleno, fontSize: 13 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
