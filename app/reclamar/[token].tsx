import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Boton, Pantalla } from '@/components/ui';
import { reclamarQr } from '@/data/reservas';
import { leerQrIdDeToken } from '@/lib/qr';
import { colors, font, spacing } from '@/theme';

type Estado = 'procesando' | 'ok' | 'invalido';

/**
 * Reclamo de un QR a través de su enlace (CLAUDE.md §6). Al abrirlo, el QR pasa
 * a "distribuido": ese es el que la puerta espera. Base del flujo del RP.
 */
export default function ReclamarScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('procesando');

  useEffect(() => {
    const limpio = decodeURIComponent(token ?? '');
    if (!leerQrIdDeToken(limpio)) {
      setEstado('invalido');
      return;
    }
    reclamarQr(limpio)
      .then(() => setEstado('ok'))
      .catch(() => setEstado('invalido'));
  }, [token]);

  return (
    <Pantalla>
      <View style={styles.content}>
        {estado === 'procesando' ? (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text style={font.muted}>Reclamando tu acceso…</Text>
          </>
        ) : estado === 'ok' ? (
          <>
            <View style={[styles.icon, { borderColor: colors.success }]}>
              <Text style={[styles.iconTxt, { color: colors.success }]}>✓</Text>
            </View>
            <Text style={font.h2}>Acceso reclamado</Text>
            <Text style={[font.muted, styles.centerText]}>
              Tu QR quedó distribuido. Muéstralo en la puerta para entrar.
            </Text>
            <Boton titulo="Entendido" onPress={() => router.replace('/(cliente)')} />
          </>
        ) : (
          <>
            <View style={[styles.icon, { borderColor: colors.danger }]}>
              <Text style={[styles.iconTxt, { color: colors.danger }]}>!</Text>
            </View>
            <Text style={font.h2}>Enlace no válido</Text>
            <Text style={[font.muted, styles.centerText]}>
              Este enlace de acceso no es válido o ya fue procesado.
            </Text>
            <Boton titulo="Ir al inicio" variante="secundario" onPress={() => router.replace('/(cliente)')} />
          </>
        )}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  centerText: { textAlign: 'center' },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTxt: { fontSize: 30, fontWeight: '900' },
});
