import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/ui';
import { DEMO_CONSUMO_MINIMO_MESA } from '@/data/mock';
import { obtenerEvento } from '@/data/eventos';
import { crearReserva, ErrorReserva } from '@/data/reservas';
import { tycCorporativo, tycEfectivoDeAntro, tycGeneral } from '@/data/tyc';
import { colors, font, radius, spacing } from '@/theme';
import type { Evento, ModalidadReserva } from '@/types';

const MAX_INVITADOS = 10;

export default function ReservarScreen() {
  const { eventoId } = useLocalSearchParams<{ eventoId: string }>();
  const router = useRouter();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [modalidad, setModalidad] = useState<ModalidadReserva>('acceso');
  const [invitados, setInvitados] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tycAntro, setTycAntro] = useState('');
  const [mostrarTycCompleto, setMostrarTycCompleto] = useState(false);

  useEffect(() => {
    obtenerEvento(eventoId).then((e) => {
      setEvento(e);
      if (e && !e.modalidades.includes('acceso') && e.modalidades.includes('mesa')) {
        setModalidad('mesa');
      }
      if (e) tycEfectivoDeAntro(e.antroId).then(setTycAntro);
    });
  }, [eventoId]);

  async function confirmar() {
    setError(null);
    setEnviando(true);
    try {
      const reserva = await crearReserva({ eventoId, modalidad, numInvitados: invitados });
      router.replace(`/reserva/${reserva.id}`);
    } catch (e) {
      setError(e instanceof ErrorReserva ? e.message : 'No se pudo crear la reserva.');
      setEnviando(false);
    }
  }

  if (!evento) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={font.kicker}>Reservar</Text>
        <Text style={font.h2}>{evento.nombre}</Text>

        <Text style={styles.label}>Modalidad</Text>
        <View style={styles.opciones}>
          {evento.modalidades.map((m) => (
            <Pressable
              key={m}
              style={[styles.opcion, modalidad === m && styles.opcionActiva]}
              onPress={() => setModalidad(m)}
            >
              <Text style={[styles.opcionTitulo, modalidad === m && styles.opcionTituloActivo]}>
                {m === 'mesa' ? 'Mesa' : 'Acceso'}
              </Text>
              <Text style={styles.opcionDetalle}>
                {m === 'mesa' ? 'Mesa asegurada con consumo mínimo' : 'Entrada garantizada, sin mesa'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Invitados</Text>
        <View style={styles.stepper}>
          <Pressable style={styles.stepBtn} onPress={() => setInvitados((n) => Math.max(1, n - 1))}>
            <Text style={styles.stepTxt}>−</Text>
          </Pressable>
          <Text style={styles.stepValor}>{invitados}</Text>
          <Pressable style={styles.stepBtn} onPress={() => setInvitados((n) => Math.min(MAX_INVITADOS, n + 1))}>
            <Text style={styles.stepTxt}>+</Text>
          </Pressable>
        </View>
        <Text style={font.muted}>Se generará un QR por cada invitado.</Text>

        {modalidad === 'mesa' ? (
          <View style={styles.minimo}>
            <Text style={styles.minimoEtiqueta}>Consumo mínimo</Text>
            <Text style={styles.minimoMonto}>${DEMO_CONSUMO_MINIMO_MESA.toLocaleString('es-MX')} MXN</Text>
            <Text style={font.muted}>El monto puede variar según la mesa asignada.</Text>
          </View>
        ) : null}

        {tycAntro ? (
          <View style={styles.tyc}>
            <Text style={styles.tycTitulo}>Antes de reservar</Text>
            <Text style={styles.tycTexto}>{tycAntro}</Text>
            {mostrarTycCompleto ? (
              <>
                <Text style={styles.tycExtra}>{tycCorporativo(evento.corporativoId)}</Text>
                <Text style={styles.tycExtra}>{tycGeneral()}</Text>
              </>
            ) : null}
            <Pressable onPress={() => setMostrarTycCompleto((v) => !v)}>
              <Text style={styles.tycLink}>
                {mostrarTycCompleto ? 'Ocultar' : 'Ver términos completos'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Boton
          titulo={`Confirmar ${modalidad === 'mesa' ? 'mesa' : 'acceso'}`}
          onPress={confirmar}
          cargando={enviando}
        />
        <Text style={styles.nota}>Confirmación instantánea. Cancela antes de la hora límite sin penalización.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  label: { ...font.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.md },
  opciones: { gap: spacing.sm },
  opcion: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  opcionActiva: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  opcionTitulo: { color: colors.text, fontSize: 16, fontWeight: '800' },
  opcionTituloActivo: { color: colors.primary },
  opcionDetalle: { color: colors.textMuted, fontSize: 13 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, alignSelf: 'flex-start' },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTxt: { color: colors.text, fontSize: 24, fontWeight: '800' },
  stepValor: { color: colors.text, fontSize: 24, fontWeight: '900', minWidth: 32, textAlign: 'center' },
  minimo: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
    marginTop: spacing.sm,
  },
  minimoEtiqueta: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  minimoMonto: { color: colors.text, fontSize: 22, fontWeight: '900' },
  error: { color: colors.danger, fontSize: 13, marginTop: spacing.sm },
  tyc: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    marginTop: spacing.md,
  },
  tycTitulo: { color: colors.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  tycTexto: { color: colors.text, fontSize: 12, lineHeight: 17 },
  tycExtra: { color: colors.textFaint, fontSize: 11, lineHeight: 16, marginTop: 4 },
  tycLink: { color: colors.accent, fontSize: 12, fontWeight: '700', marginTop: 4 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  nota: { color: colors.textFaint, fontSize: 12, textAlign: 'center' },
});
