import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton, Campo, Pantalla } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, font, spacing } from '@/theme';

export default function RegistroScreen() {
  const router = useRouter();
  const { registrar, demo } = useAuth();
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crear() {
    setError(null);
    if (!nombre || !email || !password) {
      setError('Nombre, correo y contraseña son obligatorios.');
      return;
    }
    setCargando(true);
    try {
      await registrar({ nombre: nombre.trim(), username: username.trim(), email: email.trim(), telefono: telefono.trim(), password });
      // Tras registrar, se verifica el correo. En demo se entra directo.
      router.replace(demo ? '/(cliente)' : '/(auth)/verificar');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Pantalla>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={font.kicker}>Crear cuenta</Text>
          <Text style={styles.title}>Tu acceso a la noche</Text>
          <Text style={font.muted}>Toda cuenta nace como cliente. El acceso de personal es por invitación.</Text>
        </View>

        {demo ? <Text style={styles.demo}>Modo demo: el registro no persiste, solo simula la sesión.</Text> : null}

        <View style={styles.form}>
          <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} placeholder="Tu nombre" />
          <Campo etiqueta="Usuario" value={username} onChangeText={setUsername} placeholder="usuario" autoCapitalize="none" />
          <Campo etiqueta="Correo" value={email} onChangeText={setEmail} placeholder="tu@correo.com" autoCapitalize="none" keyboardType="email-address" />
          <Campo etiqueta="Teléfono" value={telefono} onChangeText={setTelefono} placeholder="+52..." keyboardType="phone-pad" />
          <Campo etiqueta="Contraseña" value={password} onChangeText={setPassword} placeholder="Mínimo 8 caracteres" secureTextEntry />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Boton titulo="Crear cuenta" onPress={crear} cargando={cargando} />
        </View>
      </ScrollView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { ...font.title, marginTop: spacing.xs },
  demo: { color: colors.primary, fontSize: 13 },
  form: { gap: spacing.md },
  error: { color: colors.danger, fontSize: 13 },
});
