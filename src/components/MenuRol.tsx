import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { menuDeRol } from '@/menu/menus';
import { puede } from '@/permissions/matrix';
import { colors, gradients, radius, spacing } from '@/theme';
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
 * Tablero "home" de un rol: cuadrícula de tarjetas clicables, mostrando SOLO las
 * funciones que el rol tiene permitidas (matriz de permisos). Mobile-first.
 */
export function MenuRol({ rol }: { rol: Rol }) {
  const router = useRouter();
  const items = menuDeRol(rol).filter((it) => !it.accion || puede(rol, it.accion));

  return (
    <View style={styles.grid}>
      {items.map((it) => (
        <Pressable key={it.clave} style={styles.card} onPress={() => router.push(it.ruta as never)}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.icono}
          >
            <Text style={styles.iconoTxt}>{iniciales(it.titulo)}</Text>
          </LinearGradient>
          <Text style={styles.titulo} numberOfLines={2}>
            {it.titulo}
          </Text>
          <Text style={styles.subtitulo} numberOfLines={2}>
            {it.subtitulo}
          </Text>
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
    padding: spacing.md,
    gap: spacing.xs,
    minHeight: 130,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  iconoTxt: { color: '#04141A', fontWeight: '900', fontSize: 16 },
  titulo: { color: colors.text, fontSize: 16, fontWeight: '800' },
  subtitulo: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
});
