import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton, Campo } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { reclamarInvitacion } from '@/data/invitaciones';
import { colors, font, radius, spacing } from '@/theme';

export default function PerfilScreen() {
  const router = useRouter();
  const { usuario, cerrarSesion, demo, cambiarRolDemo } = useAuth();
  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function salir() {
    await cerrarSesion();
    router.replace('/(auth)/login');
  }

  async function canjearCodigo() {
    // Conecta el campo discreto del perfil (CLAUDE.md §6) con el reclamo real:
    // genera una invitación en la vista de Personal → Invitaciones y cánjeala aquí.
    setMensaje(null);
    const r = await reclamarInvitacion(codigo);
    if (r.ok && r.rol) {
      cambiarRolDemo(r.rol);
      router.replace('/');
    } else {
      setMensaje(r.error ?? 'Código inválido.');
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <View style={styles.avatar}>
        <Text style={styles.avatarTxt}>
          {(usuario?.nombre ?? 'A').slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.nombre}>{usuario?.nombre ?? 'Invitado'}</Text>
      <Text style={font.muted}>{usuario?.email}</Text>

      <View style={styles.card}>
        <Dato etiqueta="Usuario" valor={usuario?.username || '—'} />
        <Dato etiqueta="Teléfono" valor={usuario?.telefono || '—'} />
        <Dato
          etiqueta="Correo verificado"
          valor={usuario?.emailVerificado ? 'Sí' : 'Pendiente'}
          color={usuario?.emailVerificado ? colors.success : colors.warning}
        />
        <Dato
          etiqueta="Teléfono verificado"
          valor={usuario?.telefonoVerificado ? 'Sí' : 'Pendiente'}
          color={usuario?.telefonoVerificado ? colors.success : colors.warning}
        />
      </View>

      {/* Campo discreto de código de invitación (no se anuncia en pantallas públicas). */}
      <Pressable onPress={() => setMostrarCodigo((v) => !v)}>
        <Text style={styles.codigoLink}>
          {mostrarCodigo ? 'Ocultar' : '¿Tienes un código de invitación?'}
        </Text>
      </Pressable>
      {mostrarCodigo ? (
        <View style={styles.codigoBox}>
          <Campo
            value={codigo}
            onChangeText={setCodigo}
            placeholder="Código de invitación"
            autoCapitalize="characters"
          />
          {mensaje ? <Text style={font.muted}>{mensaje}</Text> : null}
          <Boton titulo="Canjear" variante="secundario" onPress={canjearCodigo} />
        </View>
      ) : null}

      {demo ? (
        <>
          <Text style={styles.demo}>Sesión demo activa.</Text>
          <Boton
            titulo="Ver vistas del personal (demo)"
            variante="secundario"
            onPress={() => router.push('/(staff)/rol')}
          />
        </>
      ) : null}

      <Boton titulo="Cerrar sesión" variante="peligro" onPress={salir} />
    </ScrollView>
  );
}

function Dato({ etiqueta, valor, color }: { etiqueta: string; valor: string; color?: string }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={[styles.datoValor, color ? { color } : null]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md, alignItems: 'stretch' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  avatarTxt: { color: colors.primary, fontSize: 28, fontWeight: '900' },
  nombre: { ...font.h2, textAlign: 'center', marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  dato: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  datoEtiqueta: { color: colors.textMuted, fontSize: 13 },
  datoValor: { color: colors.text, fontSize: 14, fontWeight: '700' },
  codigoLink: { color: colors.textFaint, fontSize: 13, textAlign: 'center', marginTop: spacing.sm },
  codigoBox: { gap: spacing.sm },
  demo: { color: colors.primary, fontSize: 13, textAlign: 'center' },
});
