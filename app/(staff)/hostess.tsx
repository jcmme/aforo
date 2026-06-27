import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton, Campo } from '@/components/ui';
import { historialMesa, listarReservasPiso, moverMesa } from '@/data/operacion';
import { colors, font, radius, spacing } from '@/theme';
import type { MovimientoMesa } from '@/types';

const ANTRO_ID = 'antro-1';

interface ReservaPiso {
  id: string;
  nombre: string;
  modalidad: string;
  numInvitados: number;
  mesaTexto: string | null;
}

export default function HostessScreen() {
  const [reservas, setReservas] = useState<ReservaPiso[]>([]);
  const [abierta, setAbierta] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setReservas(await listarReservasPiso(ANTRO_ID));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
      <Text style={font.kicker}>Asignación de mesa</Text>
      <Text style={font.muted}>
        Toda reserva que llega registra su mesa. El historial es encadenado: la mesa
        actual es el último eslabón.
      </Text>

      {reservas.map((r) => (
        <FilaReserva
          key={r.id}
          reserva={r}
          abierta={abierta === r.id}
          onToggle={() => setAbierta(abierta === r.id ? null : r.id)}
          onGuardado={cargar}
        />
      ))}
    </ScrollView>
  );
}

function FilaReserva({
  reserva,
  abierta,
  onToggle,
  onGuardado,
}: {
  reserva: ReservaPiso;
  abierta: boolean;
  onToggle: () => void;
  onGuardado: () => void;
}) {
  const [mesa, setMesa] = useState('');
  const [hist, setHist] = useState<MovimientoMesa[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (abierta) historialMesa(reserva.id).then(setHist);
  }, [abierta, reserva.id]);

  async function guardar() {
    if (!mesa.trim()) return;
    setGuardando(true);
    await moverMesa(reserva.id, mesa.trim());
    setMesa('');
    await Promise.all([onGuardado()]);
    setHist(await historialMesa(reserva.id));
    setGuardando(false);
  }

  return (
    <View style={styles.card}>
      <Pressable onPress={onToggle} style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={font.h3}>{reserva.nombre}</Text>
          <Text style={font.muted}>
            {reserva.modalidad === 'mesa' ? 'Mesa' : 'Acceso'} · {reserva.numInvitados} px
          </Text>
        </View>
        <View style={styles.mesaActual}>
          <Text style={styles.mesaActualEt}>Mesa actual</Text>
          <Text style={styles.mesaActualVal}>{reserva.mesaTexto ?? 'Sin asignar'}</Text>
        </View>
      </Pressable>

      {abierta ? (
        <View style={styles.detalle}>
          <Campo
            etiqueta={reserva.mesaTexto ? 'Mover a' : 'Asignar mesa'}
            value={mesa}
            onChangeText={setMesa}
            placeholder="Ej. Terraza 4 / Booth 2"
          />
          <Boton titulo={reserva.mesaTexto ? 'Mover mesa' : 'Asignar mesa'} onPress={guardar} cargando={guardando} />

          {hist.length > 0 ? (
            <View style={styles.hist}>
              <Text style={styles.histTitulo}>Historial</Text>
              {hist.map((m) => (
                <Text key={m.id} style={styles.histLinea}>
                  {m.mesaAnterior ? `${m.mesaAnterior} → ` : 'Asignación: '}
                  {m.mesaNueva}
                  {'  ·  '}
                  {new Date(m.creadoEn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  cardHead: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  mesaActual: { alignItems: 'flex-end' },
  mesaActualEt: { color: colors.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  mesaActualVal: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  detalle: { padding: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  hist: { marginTop: spacing.sm, gap: 4 },
  histTitulo: { ...font.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  histLinea: { color: colors.textMuted, fontSize: 13 },
});
