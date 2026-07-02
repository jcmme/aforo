import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { enlaceReclamo } from '@/lib/qr';
import { enviarPorWhatsApp, mensajeInvitacion } from '@/lib/whatsapp';
import { colors, gradients, radius, spacing } from '@/theme';
import type { QRInvitado } from '@/types';

const ESTADO_LABEL: Record<QRInvitado['estado'], { texto: string; color: string }> = {
  pendiente: { texto: 'Sin distribuir', color: colors.textMuted },
  distribuido: { texto: 'Distribuido', color: colors.accent },
  usado_puerta: { texto: 'Adentro', color: colors.success },
};

/**
 * QR de un invitado, protagonista de la pantalla posterior a la reserva
 * (CLAUDE.md §9). Permite copiar el enlace de reclamo o enviarlo por WhatsApp.
 */
export function QRInvitadoView({
  qr,
  indice,
  total,
  eventoNombre,
}: {
  qr: QRInvitado;
  indice: number;
  total: number;
  /** Si se pasa, "Enviar por WhatsApp" arma un mensaje con el nombre del lugar. */
  eventoNombre?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const estado = ESTADO_LABEL[qr.estado];
  const link = enlaceReclamo(qr.token);

  async function copiarEnlace() {
    await Clipboard.setStringAsync(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }

  function compartirWhatsApp() {
    const mensaje = eventoNombre
      ? mensajeInvitacion({ nombreInvitado: 'ahí', lugar: eventoNombre, link })
      : link;
    enviarPorWhatsApp(mensaje);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.indice}>
        Invitado {indice} de {total}
      </Text>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.qrFrame}
      >
        <View style={styles.qrBox}>
          <QRCode
            value={qr.token}
            size={220}
            color={colors.qrFg}
            backgroundColor={colors.qrBg}
          />
        </View>
      </LinearGradient>
      <View style={[styles.estado, { borderColor: estado.color }]}>
        <View style={[styles.dot, { backgroundColor: estado.color }]} />
        <Text style={[styles.estadoTexto, { color: estado.color }]}>{estado.texto}</Text>
      </View>
      <View style={styles.acciones}>
        <Pressable style={styles.compartir} onPress={copiarEnlace}>
          <Text style={styles.compartirTexto}>{copiado ? 'Copiado' : 'Copiar enlace'}</Text>
        </Pressable>
        <Pressable style={[styles.compartir, styles.whatsapp]} onPress={compartirWhatsApp}>
          <Text style={styles.whatsappTexto}>Enviar por WhatsApp</Text>
        </Pressable>
      </View>
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
  qrFrame: {
    padding: 4,
    borderRadius: radius.lg + 4,
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
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  compartir: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  whatsapp: { backgroundColor: colors.accent, borderColor: colors.accent },
  compartirTexto: { color: colors.text, fontWeight: '700', fontSize: 13 },
  whatsappTexto: { color: colors.onAccent, fontWeight: '800', fontSize: 13 },
});
