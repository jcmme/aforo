import { useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text } from 'react-native';

import { Fila, SeccionLabel } from '@/components/ui';
import { avisoPrivacidadUrl } from '@/data/legal';
import { colors, font, spacing } from '@/theme';

/** Menú "Políticas y privacidad" (estilo lista tipo guía). */
export default function PrivacidadScreen() {
  const router = useRouter();

  async function abrirAviso() {
    const url = await avisoPrivacidadUrl();
    if (url) Linking.openURL(url).catch(() => {});
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.muted}>
        Cómo tratamos tu información y cómo controlarla. AFORO no usa publicidad ni
        rastreo entre apps.
      </Text>

      <SeccionLabel>Documentos</SeccionLabel>
      <Fila titulo="Aviso de privacidad" subtitulo="Qué datos usamos y para qué" onPress={abrirAviso} primera />

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
