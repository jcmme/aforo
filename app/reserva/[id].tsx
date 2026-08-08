import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EstadoReservaBadge } from '@/components/EstadoReservaBadge';
import { QRInvitadoView } from '@/components/QRInvitadoView';
import { Boton } from '@/components/ui';
import { cancelarReserva, obtenerReserva } from '@/data/reservas';
import { obtenerEvento } from '@/data/eventos';
import { colors, font, spacing } from '@/theme';
import type { Evento, Reserva } from '@/types';

const ANCHO = Dimensions.get('window').width;

export default function ReservaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cancelando, setCancelando] = useState(false);

  async function cargar() {
    const r = await obtenerReserva(id);
    setReserva(r);
    if (r) setEvento(await obtenerEvento(r.eventoId));
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, [id]);

  function confirmarCancelacion() {
    Alert.alert(
      'Cancelar reserva',
      'Si cancelas antes de la hora límite no hay penalización. Después contará como no-show.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Cancelar reserva',
          style: 'destructive',
          onPress: async () => {
            setCancelando(true);
            await cancelarReserva(id);
            await cargar();
            setCancelando(false);
          },
        },
      ],
    );
  }

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!reserva) {
    return (
      <View style={styles.center}>
        <Text style={font.muted}>Reserva no encontrada.</Text>
      </View>
    );
  }

  const activa = reserva.estado === 'confirmada' || reserva.estado === 'lista_espera';

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <View style={styles.head}>
        <Text style={font.kicker}>Tu acceso</Text>
        <Text style={font.h2}>{evento?.nombre ?? 'Reserva'}</Text>
        <EstadoReservaBadge estado={reserva.estado} />
        <Text style={font.muted}>
          {reserva.modalidad === 'mesa' ? 'Mesa' : 'Acceso'} · {reserva.numInvitados} invitado(s)
          {reserva.consumoMinimo ? ` · mín. $${reserva.consumoMinimo.toLocaleString('es-MX')}` : ''}
        </Text>
      </View>

      <FlatList
        data={reserva.qrs}
        keyExtractor={(q) => q.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={{ width: ANCHO - spacing.lg * 2, paddingHorizontal: spacing.xs }}>
            <QRInvitadoView qr={item} indice={index + 1} total={reserva.qrs.length} eventoNombre={evento?.nombre} />
          </View>
        )}
        ListEmptyComponent={<Text style={font.muted}>Esta reserva no tiene QR.</Text>}
      />

      <Text style={styles.hint}>
        Comparte el enlace de cada QR con tus invitados. El QR que abran pasa a
        "distribuido" y es el que la puerta espera. Un QR nunca distribuido no penaliza.
      </Text>

      <View style={styles.footer}>
        <Boton titulo="Listo" variante="secundario" onPress={() => router.replace('/(cliente)/reservas')} />
        {activa ? (
          <Boton titulo="Cancelar reserva" variante="peligro" onPress={confirmarCancelacion} cargando={cancelando} />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  head: { gap: spacing.sm, alignItems: 'flex-start' },
  hint: { color: colors.textFaint, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  footer: { gap: spacing.sm },
});
