import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton, Pantalla } from '@/components/ui';
import { aceptarAviso } from '@/lib/consentimiento';
import { colors, familias, font, radius, spacing } from '@/theme';

/**
 * Pantalla de bienvenida y consentimiento de privacidad (LFPDPPP + Apple
 * §5.1.1(ii)). Transparente sobre el uso de datos: la app NO usa rastreo
 * publicitario; los identificadores de dispositivo se usan solo para prevención
 * de fraude. El usuario acepta y puede optar por recibir promociones o no.
 */
export default function BienvenidaScreen() {
  const router = useRouter();
  const [promos, setPromos] = useState(true);
  const [guardando, setGuardando] = useState(false);

  async function continuar() {
    setGuardando(true);
    await aceptarAviso(promos);
    router.replace('/(cliente)');
  }

  return (
    <Pantalla>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <Text style={font.kicker}>AFORO</Text>
          <Text style={styles.titulo}>Bienvenido</Text>
          <Text style={styles.parrafo}>
            Cuidamos tu privacidad y somos claros con el uso de tus datos. AFORO
            usa tu información únicamente para gestionar tus reservas y para
            prevenir el fraude de reservas incumplidas.
          </Text>
          <Text style={styles.parrafo}>
            No usamos publicidad ni rastreo entre apps. Los identificadores de tu
            dispositivo se usan solo para prevención de fraude, nunca para
            anunciar ni se comparten con terceros.
          </Text>

          <Pressable style={styles.enlace} onPress={() => router.push('/legal/aviso')}>
            <Text style={styles.enlaceTxt}>Leer el Aviso de privacidad</Text>
            <Text style={styles.enlaceFlecha}>›</Text>
          </Pressable>

          <Pressable style={styles.check} onPress={() => setPromos((v) => !v)}>
            <View style={[styles.box, promos && styles.boxOn]}>
              {promos ? <Text style={styles.boxTick}>✓</Text> : null}
            </View>
            <Text style={styles.checkTxt}>
              Quiero recibir promociones y novedades de los antros (opcional).
            </Text>
          </Pressable>
        </View>

        <View style={styles.abajo}>
          <Boton titulo="Aceptar y continuar" onPress={continuar} cargando={guardando} />
          <Text style={styles.nota}>
            Puedes cambiar esto cuando quieras en Perfil › Políticas y privacidad.
          </Text>
        </View>
      </ScrollView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.xl, justifyContent: 'space-between', gap: spacing.xl },
  top: { gap: spacing.md, marginTop: spacing.xl },
  titulo: { ...font.display, fontSize: 40 },
  parrafo: { ...font.body, color: colors.textMuted },
  enlace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    marginTop: spacing.sm,
  },
  enlaceTxt: { color: colors.text, fontFamily: familias.regular, fontSize: 15 },
  enlaceFlecha: { color: colors.textFaint, fontSize: 22 },
  check: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginTop: spacing.sm },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  boxTick: { color: colors.onAccent, fontFamily: familias.semi, fontSize: 13 },
  checkTxt: { flex: 1, color: colors.textMuted, fontFamily: familias.regular, fontSize: 13, lineHeight: 19 },
  abajo: { gap: spacing.sm },
  nota: { color: colors.textFaint, fontSize: 12, textAlign: 'center' },
});
