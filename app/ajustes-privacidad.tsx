import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { SeccionLabel } from '@/components/ui';
import {
  guardarConsentimiento,
  obtenerConsentimiento,
  type Consentimiento,
} from '@/lib/consentimiento';
import { colors, familias, font, radius, spacing } from '@/theme';

/**
 * Ajustes de privacidad: el usuario ve su consentimiento y controla las
 * finalidades. La prevención de fraude es necesaria para el Servicio (no se
 * puede apagar sin dejar de usar AFORO); las promociones sí son opcionales.
 * Cumple Apple §5.1.1(ii): forma fácil y accesible de retirar el consentimiento.
 */
export default function AjustesPrivacidadScreen() {
  const [c, setC] = useState<Consentimiento | null>(null);

  useFocusEffect(
    useCallback(() => {
      obtenerConsentimiento().then(setC);
    }, []),
  );

  async function togglePromos(v: boolean) {
    await guardarConsentimiento({ promociones: v });
    setC((prev) => (prev ? { ...prev, promociones: v } : prev));
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <SeccionLabel>Finalidades</SeccionLabel>

      <View style={styles.card}>
        <View style={styles.filaSwitch}>
          <View style={{ flex: 1 }}>
            <Text style={styles.titulo}>Gestión de reservas</Text>
            <Text style={styles.sub}>Necesario para crear y operar tus reservas.</Text>
          </View>
          <Text style={styles.necesario}>Necesario</Text>
        </View>

        <View style={styles.divisor} />

        <View style={styles.filaSwitch}>
          <View style={{ flex: 1 }}>
            <Text style={styles.titulo}>Prevención de fraude</Text>
            <Text style={styles.sub}>
              Identificadores del dispositivo para detectar reservas incumplidas.
              No se usa para publicidad ni se comparte.
            </Text>
          </View>
          <Text style={styles.necesario}>Necesario</Text>
        </View>

        <View style={styles.divisor} />

        <View style={styles.filaSwitch}>
          <View style={{ flex: 1 }}>
            <Text style={styles.titulo}>Promociones y novedades</Text>
            <Text style={styles.sub}>Opcional. Puedes activarlas o desactivarlas.</Text>
          </View>
          <Switch
            value={c?.promociones ?? true}
            onValueChange={togglePromos}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor={colors.text}
          />
        </View>
      </View>

      {c?.fecha ? (
        <Text style={styles.fecha}>
          Consentimiento registrado el {new Date(c.fecha).toLocaleDateString('es-MX')}.
        </Text>
      ) : null}

      <SeccionLabel>Revocar</SeccionLabel>
      <Text style={font.muted}>
        Para revocar el consentimiento de las finalidades necesarias tendrías que
        dejar de usar AFORO. Puedes eliminar tu cuenta en cualquier momento desde
        tu perfil; se borran tus datos y tus reservas quedan anonimizadas.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.lg,
  },
  filaSwitch: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  divisor: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline },
  titulo: { color: colors.text, fontFamily: familias.medium, fontSize: 15 },
  sub: { color: colors.textMuted, fontFamily: familias.regular, fontSize: 12, lineHeight: 18, marginTop: 3 },
  necesario: { color: colors.textFaint, fontFamily: familias.medium, fontSize: 12 },
  fecha: { color: colors.textFaint, fontSize: 12, marginTop: spacing.xs },
});
