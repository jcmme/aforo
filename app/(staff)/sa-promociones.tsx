import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton, Campo } from '@/components/ui';
import { antrosTodos, crearPromocion, listarPromociones, togglePausaPromo } from '@/data/superadmin';
import { colors, font, radius, spacing } from '@/theme';
import type { PromocionItem } from '@/types';

/** Promociones: creación EXCLUSIVA del Súper Admin (CLAUDE.md §6). */
export default function SaPromocionesScreen() {
  const antros = antrosTodos();
  const [nombre, setNombre] = useState('');
  const [antroId, setAntroId] = useState(antros[0]?.id ?? '');
  const [pagada, setPagada] = useState(false);
  const [monto, setMonto] = useState('');
  const [lista, setLista] = useState<PromocionItem[]>(listarPromociones());

  function crear() {
    if (!nombre.trim()) return;
    crearPromocion(nombre.trim(), antroId, pagada, pagada ? parseInt(monto.replace(/\D/g, ''), 10) || 0 : null);
    setNombre(''); setMonto(''); setPagada(false);
    setLista(listarPromociones());
  }

  function pausar(id: string) {
    togglePausaPromo(id);
    setLista(listarPromociones());
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.muted}>Nadie del corporativo puede subir promociones. Es la palanca de monetización de MABI.</Text>

      <View style={styles.form}>
        <Campo etiqueta="Nombre de la promo" value={nombre} onChangeText={setNombre} placeholder="2x1 en barra…" />
        <Text style={styles.label}>Antro</Text>
        <View style={styles.chips}>
          {antros.map((a) => (
            <Pressable key={a.id} style={[styles.chip, antroId === a.id && styles.chipOn]} onPress={() => setAntroId(a.id)}>
              <Text style={[styles.chipTxt, antroId === a.id && { color: '#04141A' }]}>{a.nombre}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.checkRow} onPress={() => setPagada((v) => !v)}>
          <View style={[styles.check, pagada && styles.checkOn]}>{pagada ? <Text style={styles.checkTxt}>✓</Text> : null}</View>
          <Text style={font.body}>Difusión pagada</Text>
        </Pressable>
        {pagada ? <Campo etiqueta="Monto (MXN)" value={monto} onChangeText={setMonto} placeholder="0" keyboardType="number-pad" /> : null}
        <Boton titulo="Crear promoción" onPress={crear} />
      </View>

      <Text style={styles.label}>Promociones</Text>
      {lista.map((p) => (
        <View key={p.id} style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={font.h3}>{p.nombre}</Text>
            <Text style={font.muted}>
              {p.antroNombre} · {p.pagada ? `pagada $${(p.monto ?? 0).toLocaleString('es-MX')}` : 'cortesía'}
              {p.pausada ? ' · pausada' : ''}
            </Text>
          </View>
          <Pressable onPress={() => pausar(p.id)}>
            <Text style={styles.accion}>{p.pausada ? 'Reanudar' : 'Pausar'}</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  form: { gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  label: { ...font.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingVertical: 6, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt: { color: colors.text, fontWeight: '700', fontSize: 13 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  check: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkTxt: { color: '#04141A', fontWeight: '900' },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  accion: { color: colors.primary, fontWeight: '800', fontSize: 13 },
});
