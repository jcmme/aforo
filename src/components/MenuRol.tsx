import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { menuDeRol } from '@/menu/menus';
import { puede } from '@/permissions/matrix';
import { colors, radius, spacing } from '@/theme';
import type { Rol } from '@/types';

/** Iniciales de un título para el ícono de la tarjeta (sin emoji). */
function iniciales(titulo: string): string {
  return titulo
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/**
 * Tablero "home" de un rol: cuadrícula de tarjetas, mostrando SOLO las funciones
 * permitidas (matriz de permisos). Estilo minimalista: monocromo + acento sobrio.
 */
export function MenuRol({ rol }: { rol: Rol }) {
  const router = useRouter();
  const items = menuDeRol(rol).filter((it) => !it.accion || puede(rol, it.accion));

  return (
    <View style={styles.grid}>
      {items.map((it) => (
        <Pressable
          key={it.clave}
          style={({ pressed }) => [styles.card, pressed && styles.cardPress]}
          onPress={() => router.push(it.ruta as never)}
        >
          <View style={styles.icono}>
            <Text style={styles.iconoTxt}>{iniciales(it.titulo)}</Text>
          </View>
          <View style={styles.texto}>
            <Text style={styles.titulo} numberOfLines={2}>
              {it.titulo}
            </Text>
            <Text style={styles.subtitulo} numberOfLines={2}>
              {it.subtitulo}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  cardPress: { backgroundColor: colors.surfaceAlt },
  icono: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoTxt: { color: colors.accent, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  texto: { gap: 3 },
  titulo: { color: colors.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  subtitulo: { color: colors.textMuted, fontSize: 12, lineHeight: 16 },
});
