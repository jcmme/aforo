import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { editarParametro, listarParametros } from '@/data/superadmin';
import { colors, font, radius, spacing } from '@/theme';
import type { ParametroConfig } from '@/types';

/**
 * Parámetros sin código: el principio rector del Súper Admin. Todo lo que hoy
 * requeriría tocar código se edita aquí (umbrales, cifras, ventanas, textos…).
 */
export default function SaParametrosScreen() {
  const [params, setParams] = useState<ParametroConfig[]>(listarParametros());

  function guardar(clave: string, valor: string) {
    editarParametro(clave, valor);
    setParams(listarParametros());
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.muted}>
        Edita el comportamiento del sistema sin tocar código. Cambia y guarda cada
        parámetro; aplica en todos los corporativos (o por corporativo/antro en producción).
      </Text>
      {params.map((p) => (
        <Param key={p.clave} param={p} onGuardar={guardar} />
      ))}
    </ScrollView>
  );
}

function Param({ param, onGuardar }: { param: ParametroConfig; onGuardar: (c: string, v: string) => void }) {
  const [valor, setValor] = useState(param.valor);
  const cambiado = valor !== param.valor;
  return (
    <View style={styles.card}>
      <Text style={styles.clave}>{param.clave}</Text>
      <Text style={styles.desc}>{param.descripcion}</Text>
      <View style={styles.row}>
        <TextInput value={valor} onChangeText={setValor} style={styles.input} placeholderTextColor={colors.textFaint} />
        <Pressable style={[styles.guardar, !cambiado && styles.guardarOff]} disabled={!cambiado} onPress={() => onGuardar(param.clave, valor)}>
          <Text style={styles.guardarTxt}>Guardar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 4 },
  clave: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  desc: { color: colors.textMuted, fontSize: 12 },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.xs },
  input: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14 },
  guardar: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  guardarOff: { opacity: 0.4 },
  guardarTxt: { color: colors.onAccent, fontWeight: '800', fontSize: 13 },
});
