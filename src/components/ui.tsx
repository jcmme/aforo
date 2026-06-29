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

import { colors, radius, spacing } from '@/theme';

/** Contenedor de pantalla con fondo oscuro y safe area. */
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
 * Botón. Primario = relleno de acento sólido (elegante), secundario = contorno
 * hairline, peligro = contorno sobrio. Sin degradados.
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
  botonPress: { opacity: 0.85 },
  botonInactivo: { opacity: 0.4 },
  botonTexto: { color: colors.text, fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },
  botonTextoPrimario: { color: colors.onAccent, fontWeight: '800' },
  botonTextoPeligro: { color: colors.danger },
  campoWrap: { gap: spacing.sm },
  campoEtiqueta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  campo: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
