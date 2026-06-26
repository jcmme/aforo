import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { EstadoReservaBadge } from '@/components/EstadoReservaBadge';
import { listarMisReservas } from '@/data/reservas';
import { obtenerEvento } from '@/data/eventos';
import { colors, font, radius, spacing } from '@/theme';
import type { Reserva } from '@/types';

interface ReservaConEvento {
  reserva: Reserva;
  nombreEvento: string;
  fecha: string | null;
}

export default function ReservasScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ReservaConEvento[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      (async () => {
        const reservas = await listarMisReservas();
        const conEvento = await Promise.all(
          reservas.map(async (reserva) => {
            const evento = await obtenerEvento(reserva.eventoId);
            return {
              reserva,
              nombreEvento: evento?.nombre ?? 'Evento',
              fecha: evento?.fecha ?? null,
            };
          }),
        );
        if (activo) {
          setItems(conEvento);
          setCargando(false);
        }
      })();
      return () => {
        activo = false;
      };
    }, []),
  );

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={items}
      keyExtractor={(it) => it.reserva.id}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/reserva/${item.reserva.id}`)}>
          <View style={styles.cardHead}>
            <Text style={font.h3} numberOfLines={1}>
              {item.nombreEvento}
            </Text>
            <EstadoReservaBadge estado={item.reserva.estado} />
          </View>
          <Text style={font.muted}>
            {item.fecha ? new Date(item.fecha).toLocaleString('es-MX', { weekday: 'long', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
          <Text style={styles.meta}>
            {item.reserva.modalidad === 'mesa' ? 'Mesa' : 'Acceso'} · {item.reserva.numInvitados} invitado(s) · {item.reserva.qrs.length} QR
          </Text>
        </Pressable>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={font.h3}>Aún no tienes reservas</Text>
          <Text style={font.muted}>Explora los antros y aparta tu lugar.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  meta: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
});
