import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, familias, spacing } from '@/theme';

/**
 * Renderiza un documento legal largo (Aviso de Privacidad, Términos y
 * Condiciones) dentro de la app, a partir de texto en markdown ligero:
 * "# " título, "## " sección, "### " subsección, "- " viñeta, "_..._" nota
 * al pie en cursiva, el resto son párrafos normales. Así el texto vive como
 * dato editable (src/data/legal.ts) y no queda quemado en el layout.
 */
export function DocumentoLegal({ texto }: { texto: string }) {
  if (!texto) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }

  const bloques = texto.split(/\n\n+/);

  return (
    <View style={styles.contenido}>
      {bloques.map((bloque, i) => {
        const b = bloque.trim();
        if (!b) return null;
        if (b.startsWith('### ')) {
          return (
            <Text key={i} style={styles.h3}>
              {b.slice(4)}
            </Text>
          );
        }
        if (b.startsWith('## ')) {
          return (
            <Text key={i} style={styles.h2}>
              {b.slice(3)}
            </Text>
          );
        }
        if (b.startsWith('# ')) {
          return (
            <Text key={i} style={styles.h1}>
              {b.slice(2)}
            </Text>
          );
        }
        if (b.startsWith('- ')) {
          return (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletMarca}>—</Text>
              <Text style={styles.parrafo}>{b.slice(2)}</Text>
            </View>
          );
        }
        if (b.startsWith('_') && b.endsWith('_')) {
          return (
            <Text key={i} style={styles.nota}>
              {b.slice(1, -1)}
            </Text>
          );
        }
        return (
          <Text key={i} style={styles.parrafo}>
            {b}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cargando: { paddingVertical: spacing.xxl, alignItems: 'center' },
  contenido: { gap: spacing.md },
  h1: {
    color: colors.text,
    fontFamily: familias.light,
    fontSize: 26,
    letterSpacing: 0.3,
    marginBottom: spacing.xs,
  },
  h2: {
    color: colors.text,
    fontFamily: familias.medium,
    fontSize: 17,
    letterSpacing: 0.1,
    marginTop: spacing.md,
  },
  h3: {
    color: colors.accentSoft,
    fontFamily: familias.medium,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.xs,
  },
  parrafo: {
    color: colors.textMuted,
    fontFamily: familias.regular,
    fontSize: 14,
    lineHeight: 21,
    flexShrink: 1,
  },
  bullet: { flexDirection: 'row', gap: spacing.sm, paddingLeft: spacing.xs },
  bulletMarca: { color: colors.textFaint, fontFamily: familias.regular, fontSize: 14, lineHeight: 21 },
  nota: {
    color: colors.textFaint,
    fontFamily: familias.regular,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
});
