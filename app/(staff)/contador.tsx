import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { obtenerContador, guardarContador } from '@/data/operacion';
import { colors, font, radius, spacing } from '@/theme';

const ANTRO_ID = 'antro-1';

/** Fecha del día operativo (YYYY-MM-DD). */
function diaOperativo(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Contador de penetración: cada toque = una persona que entró SIN reserva de la
 * app. "+1" dominante; "−1" discreto para corregir. Arranca en ceros por noche y
 * persiste como métrica del día operativo.
 */
export default function ContadorScreen() {
  const [valor, setValor] = useState(0);
  const fecha = diaOperativo();

  useEffect(() => {
    obtenerContador(ANTRO_ID, fecha).then(setValor);
  }, [fecha]);

  function actualizar(nuevo: number) {
    const v = Math.max(0, nuevo);
    setValor(v);
    void guardarContador(ANTRO_ID, fecha, v); // optimista; persiste el total
  }

  return (
    <View style={styles.container}>
      <Text style={font.kicker}>Sin reserva · {fecha}</Text>
      <Text style={styles.valor}>{valor}</Text>

      <Pressable style={styles.mas} onPress={() => actualizar(valor + 1)}>
        <Text style={styles.masTxt}>+1</Text>
      </Pressable>

      <Pressable style={styles.menos} onPress={() => actualizar(valor - 1)} hitSlop={10}>
        <Text style={styles.menosTxt}>−1 corregir</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.lg },
  valor: { fontSize: 96, fontWeight: '900', color: colors.text },
  mas: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masTxt: { fontSize: 64, fontWeight: '900', color: '#04141A' },
  menos: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menosTxt: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
});
