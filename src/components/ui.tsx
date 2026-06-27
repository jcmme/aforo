import { LinearGradient } from 'expo-linear-gradient';
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

import { colors, gradients, radius, spacing } from '@/theme';

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

/** Botón primario / secundario. */
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
  const spinnerColor =
    variante === 'primario' ? '#04141A' : variante === 'secundario' ? colors.text : '#fff';
  const contenido = cargando ? (
    <ActivityIndicator color={spinnerColor} />
  ) : (
    <Text
      style={[
        styles.botonTexto,
        variante === 'primario' && styles.botonTextoPrimario,
        variante === 'secundario' && styles.botonTextoSecundario,
      ]}
    >
      {titulo}
    </Text>
  );

  // Primario: degradado cian (vistoso). Secundario/peligro: relleno sólido.
  if (variante === 'primario') {
    return (
      <Pressable onPress={onPress} disabled={inactivo} style={inactivo && styles.botonInactivo}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.boton}
        >
          {contenido}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      style={[
        styles.boton,
        variante === 'secundario' && styles.botonSecundario,
        variante === 'peligro' && styles.botonPeligro,
        inactivo && styles.botonInactivo,
      ]}
    >
      {contenido}
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
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={styles.campo}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.bg },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonSecundario: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  botonPeligro: { backgroundColor: colors.danger },
  botonInactivo: { opacity: 0.5 },
  botonTexto: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  botonTextoPrimario: { color: '#04141A' },
  botonTextoSecundario: { color: colors.text },
  campoWrap: { gap: spacing.xs },
  campoEtiqueta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  campo: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
