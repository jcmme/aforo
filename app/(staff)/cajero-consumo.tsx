import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton, Campo } from '@/components/ui';
import { capturarConsumo, listarMesasParaCobro } from '@/data/cajero';
import { colors, font, radius, spacing } from '@/theme';
import type { ConsumoMinimoItem } from '@/types';

/** Captura del consumo real al cierre de cuenta (exclusivo del cajero). */
export default function CajeroConsumoScreen() {
  const [mesas, setMesas] = useState<ConsumoMinimoItem[]>([]);

  const cargar = useCallback(() => {
    listarMesasParaCobro().then(setMesas);
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.muted}>
        Registra el consumo real de cada mesa con reserva al cerrar su cuenta. Alimenta el
        ranking de consumo. Tú no validas el mínimo (eso es del capitán).
      </Text>
      {mesas.map((m) => (
        <Fila key={m.reservaId} mesa={m} onGuardado={cargar} />
      ))}
    </ScrollView>
  );
}

function Fila({ mesa, onGuardado }: { mesa: ConsumoMinimoItem; onGuardado: () => void }) {
  const [monto, setMonto] = useState(mesa.consumoReal ? String(mesa.consumoReal) : '');
  const [guardando, setGuardando] = useState(false);
  const capturado = mesa.consumoReal != null;

  async function guardar() {
    const n = parseInt(monto.replace(/\D/g, ''), 10);
    if (!n) return;
    setGuardando(true);
    await capturarConsumo(mesa.reservaId, n);
    setGuardando(false);
    onGuardado();
  }

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={font.h3}>{mesa.reservaNombre}</Text>
        {capturado ? <Text style={styles.ok}>Capturado</Text> : null}
      </View>
      <Text style={font.muted}>Mínimo: ${mesa.consumoMinimo.toLocaleString('es-MX')}</Text>
      <Campo
        etiqueta="Consumo real (MXN)"
        value={monto}
        onChangeText={setMonto}
        placeholder="0"
        keyboardType="number-pad"
      />
      <Boton titulo={capturado ? 'Actualizar' : 'Capturar consumo'} onPress={guardar} cargando={guardando} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ok: { color: colors.success, fontWeight: '800', fontSize: 12 },
});
