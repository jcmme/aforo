import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { enlaceReclamo } from '@/lib/qr';
import { colors, radius, spacing } from '@/theme';
import type { QRInvitado } from '@/types';

const ESTADO_LABEL: Record<QRInvitado['estado'], { texto: string; color: string }> = {
  pendiente: { texto: 'Sin distribuir', color: colors.textMuted },
  distribuido: { texto: 'Distribuido', color: colors.accent },
  usado_puerta: { texto: 'Adentro', color: colors.success },
};

/**
 * QR de un invitado, protagonista de la pantalla posterior a la reserva
 * (CLAUDE.md §9). Permite copiar el enlace de reclamo para distribuirlo.
 */
export function QRInvitadoView({
  qr,
  indice,
  total,
}: {
  qr: QRInvitado;
  indice: number;
  total: number;
}) {
  const [copiado, setCopiado] = useState(false);
  const estado = ESTADO_LABEL[qr.estado];

  async function copiarEnlace() {
    await Clipboard.setStringAsync(enlaceReclamo(qr.token));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.indice}>
        Invitado {indice} de {total}
      </Text>
      <View style={styles.qrBox}>
        <QRCode
          value={qr.token}
          size={220}
          color={colors.qrFg}
          backgroundColor={colors.qrBg}
        />
      </View>
      <View style={[styles.estado, { borderColor: estado.color }]}>
        <View style={[styles.dot, { backgroundColor: estado.color }]} />
        <Text style={[styles.estadoTexto, { color: estado.color }]}>{estado.texto}</Text>
      </View>
      <Pressable style={styles.compartir} onPress={copiarEnlace}>
        <Text style={styles.compartirTexto}>
          {copiado ? 'Enlace copiado' : 'Copiar enlace de reclamo'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  indice: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  qrBox: {
    padding: spacing.lg,
    backgroundColor: colors.qrBg,
    borderRadius: radius.lg,
  },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  estadoTexto: { fontSize: 12, fontWeight: '700' },
  compartir: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compartirTexto: { color: colors.text, fontWeight: '700', fontSize: 13 },
});
