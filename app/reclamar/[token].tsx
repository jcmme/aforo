import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { QRInvitadoView } from '@/components/QRInvitadoView';
import { Boton, Pantalla } from '@/components/ui';
import { obtenerQrPorToken, reclamarQr } from '@/data/reservas';
import { leerQrIdDeToken } from '@/lib/qr';
import { colors, font, radius, spacing } from '@/theme';
import type { QRInvitado } from '@/types';

type Estado = 'procesando' | 'ok' | 'invalido';

/**
 * Reclamo de un QR a través de su enlace (CLAUDE.md §6). Al abrirlo, el QR pasa
 * a "distribuido" y esta pantalla YA MUESTRA EL QR: es el acceso de quien no
 * tiene la app (compartido por WhatsApp), no solo una confirmación de texto.
 * Al final, invitación no bloqueante a crear cuenta.
 */
export default function ReclamarScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('procesando');
  const [qr, setQr] = useState<QRInvitado | null>(null);
  const [eventoNombre, setEventoNombre] = useState('tu evento');

  useEffect(() => {
    const limpio = decodeURIComponent(token ?? '');
    if (!leerQrIdDeToken(limpio)) {
      setEstado('invalido');
      return;
    }
    reclamarQr(limpio)
      .then(() => obtenerQrPorToken(limpio))
      .then((r) => {
        if (!r) return setEstado('invalido');
        setQr(r.qr);
        setEventoNombre(r.eventoNombre);
        setEstado('ok');
      })
      .catch(() => setEstado('invalido'));
  }, [token]);

  return (
    <Pantalla>
      <View style={styles.content}>
        {estado === 'procesando' ? (
          <>
            <ActivityIndicator color={colors.accent} />
            <Text style={font.muted}>Cargando tu acceso…</Text>
          </>
        ) : estado === 'ok' && qr ? (
          <>
            <Text style={font.kicker}>{eventoNombre}</Text>
            <Text style={font.h2}>Este es tu acceso</Text>
            <QRInvitadoView qr={qr} indice={1} total={1} eventoNombre={eventoNombre} />
            <View style={styles.nudge}>
              <Text style={styles.nudgeTitulo}>Crea tu cuenta AFORO</Text>
              <Text style={[font.muted, styles.centerText]}>
                Guarda tus reservas, tu historial y tus insignias. Puedes hacerlo esta
                noche o después — este acceso ya está confirmado de cualquier forma.
              </Text>
              <Boton
                titulo="Crear cuenta"
                variante="secundario"
                onPress={() => router.push('/(auth)/registro')}
              />
            </View>
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
  icon: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  iconTxt: { fontSize: 30, fontWeight: '900' },
  nudge: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  nudgeTitulo: { color: colors.accent, fontWeight: '800', fontSize: 15 },
});
