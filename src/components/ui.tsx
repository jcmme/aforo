import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, font, radius, spacing } from '@/theme';

/** Contenedor de pantalla con fondo negro y safe area. */
export function Pantalla({
  children,
  style,
  edges = ['top', 'bottom'],
}: {
  children: ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  return (
    <SafeAreaView style={[styles.pantalla, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

/**
 * Botón. Primario = relleno crema/platino (texto casi negro), secundario =
 * contorno hairline, peligro = contorno sobrio. Sin degradados; respuesta de
 * pulsación inmediata y sutil.
 */
export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  cargando = false,
  deshabilitado = false,
}: {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'peligro';
  cargando?: boolean;
  deshabilitado?: boolean;
}) {
  const inactivo = cargando || deshabilitado;
  const spinnerColor = variante === 'primario' ? colors.onAccent : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [
        styles.boton,
        variante === 'primario' && styles.botonPrimario,
        variante === 'secundario' && styles.botonSecundario,
        variante === 'peligro' && styles.botonPeligro,
        pressed && styles.botonPress,
        inactivo && styles.botonInactivo,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text
          style={[
            styles.botonTexto,
            variante === 'primario' && styles.botonTextoPrimario,
            variante === 'peligro' && styles.botonTextoPeligro,
          ]}
        >
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}

/** Campo de texto con etiqueta. */
export function Campo({
  etiqueta,
  ...props
}: { etiqueta?: string } & TextInputProps) {
  return (
    <View style={styles.campoWrap}>
      {etiqueta ? <Text style={styles.campoEtiqueta}>{etiqueta}</Text> : null}
      <TextInput placeholderTextColor={colors.textFaint} style={styles.campo} {...props} />
    </View>
  );
}

/** Línea divisoria hairline (casi invisible), estilo guía. */
export function Divisor({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divisor, style]} />;
}

/**
 * Fila de lista tipo ajustes: título (+ subtítulo opcional), valor a la
 * derecha y chevron. Con divisor hairline arriba. Base del look Michelin.
 */
export function Fila({
  titulo,
  subtitulo,
  valor,
  onPress,
  primera = false,
  chevron = true,
}: {
  titulo: string;
  subtitulo?: string;
  valor?: string;
  onPress?: () => void;
  primera?: boolean;
  chevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.fila, !primera && styles.filaBorde, pressed && onPress && styles.filaPress]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.filaTitulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.filaSub}>{subtitulo}</Text> : null}
      </View>
      {valor ? <Text style={styles.filaValor}>{valor}</Text> : null}
      {chevron && onPress ? <Text style={styles.filaChevron}>›</Text> : null}
    </Pressable>
  );
}

/** Etiqueta de sección (gris, tracking), como los encabezados de Michelin. */
export function SeccionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.seccion}>{children}</Text>;
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.bg },
  boton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md + 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonPrimario: { backgroundColor: colors.accent },
  botonSecundario: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  botonPeligro: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(224,105,107,0.4)' },
  botonPress: { opacity: 0.72 },
  botonInactivo: { opacity: 0.4 },
  botonTexto: { color: colors.text, fontFamily: font.h3.fontFamily, fontSize: 15, letterSpacing: 0.3 },
  botonTextoPrimario: { color: colors.onAccent },
  botonTextoPeligro: { color: colors.danger },
  campoWrap: { gap: spacing.sm },
  campoEtiqueta: {
    color: colors.textMuted,
    fontFamily: font.kicker.fontFamily,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  campo: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    color: colors.text,
    fontFamily: font.body.fontFamily,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  divisor: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline },
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.md },
  filaBorde: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline },
  filaPress: { opacity: 0.6 },
  filaTitulo: { color: colors.text, fontFamily: font.body.fontFamily, fontSize: 16 },
  filaSub: { color: colors.textMuted, fontFamily: font.muted.fontFamily, fontSize: 13, marginTop: 2 },
  filaValor: { color: colors.textMuted, fontFamily: font.body.fontFamily, fontSize: 15 },
  filaChevron: { color: colors.textFaint, fontSize: 22, marginLeft: 2 },
  seccion: {
    color: colors.textMuted,
    fontFamily: font.kicker.fontFamily,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
});
