import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Fila, SeccionLabel } from '@/components/ui';
import { colors, font, spacing } from '@/theme';

/** Menú "Políticas y privacidad" (estilo lista tipo guía). */
export default function PrivacidadScreen() {
  const router = useRouter();

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.muted}>
        Cómo tratamos tu información y cómo controlarla. AFORO no usa publicidad ni
        rastreo entre apps.
      </Text>

      <SeccionLabel>Legal</SeccionLabel>
      <Fila
        titulo="Términos y condiciones"
        subtitulo="Las reglas de uso del Servicio"
        onPress={() => router.push('/legal/terminos')}
        primera
      />
      <Fila
        titulo="Aviso de privacidad"
        subtitulo="Qué datos usamos y para qué"
        onPress={() => router.push('/legal/aviso')}
      />

      <SeccionLabel>Tus controles</SeccionLabel>
      <Fila
        titulo="Ajustes de privacidad"
        subtitulo="Consentimiento, promociones y prevención de fraude"
        onPress={() => router.push('/ajustes-privacidad')}
        primera
      />
      <Fila
        titulo="Eliminar mi cuenta"
        subtitulo="Borra tus datos; las reservas quedan anonimizadas"
        onPress={() => router.push('/(cliente)/perfil')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
});
