import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton, Campo } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { listarEventosDeAntro } from '@/data/eventos';
import { crearReserva, ErrorReserva } from '@/data/reservas';
import { enlaceReclamo } from '@/lib/qr';
import { enviarPorWhatsApp, mensajeInvitacion } from '@/lib/whatsapp';
import { colors, font, radius, spacing } from '@/theme';
import type { Evento, ModalidadReserva, Reserva } from '@/types';

const ANTRO_ID = 'antro-1';

type Fase = 'formulario' | 'confirmar' | 'hecho';

/**
 * El capitán/RP registra a un invitado sin cuenta (solo nombre + teléfono).
 * Flujo de confirmación tipo "Invitamos a: X" (No / Sí / Cambiar invitado),
 * luego ofrece enviar el acceso por WhatsApp.
 */
export default function NuevaReservaScreen() {
  const { rolActivo } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoId, setEventoId] = useState<string | null>(null);
  const [modalidad, setModalidad] = useState<ModalidadReserva>('acceso');
  const [invitados, setInvitados] = useState(1);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fase, setFase] = useState<Fase>('formulario');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reserva, setReserva] = useState<Reserva | null>(null);

  useEffect(() => {
    listarEventosDeAntro(ANTRO_ID).then((evs) => {
      setEventos(evs);
      setEventoId(evs[0]?.id ?? null);
    });
  }, []);

  const evento = eventos.find((e) => e.id === eventoId);

  function validar(): boolean {
    setError(null);
    if (!eventoId) { setError('Elige un evento.'); return false; }
    if (!nombre.trim() || !telefono.trim()) { setError('Nombre y teléfono son obligatorios.'); return false; }
    return true;
  }

  async function confirmar() {
    setEnviando(true);
    try {
      const r = await crearReserva({
        eventoId: eventoId!,
        modalidad,
        numInvitados: invitados,
        rpId: rolActivo === 'capitan' ? 'cap-edgar' : 'rp-ana',
        invitado: { nombre: nombre.trim(), telefono: telefono.trim() },
      });
      setReserva(r);
      setFase('hecho');
    } catch (e) {
      setError(e instanceof ErrorReserva ? e.message : 'No se pudo crear la reserva.');
      setFase('formulario');
    } finally {
      setEnviando(false);
    }
  }

  function compartir() {
    if (!reserva?.qrs[0]) return;
    const mensaje = mensajeInvitacion({
      nombreInvitado: reserva.invitadoNombre ?? 'invitado',
      lugar: evento?.nombre ?? 'tu evento',
      link: enlaceReclamo(reserva.qrs[0].token),
      vigencia: evento ? new Date(evento.fecha).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : undefined,
    });
    enviarPorWhatsApp(mensaje, reserva.invitadoTelefono);
  }

  // --- Fase: hecho ---
  if (fase === 'hecho' && reserva) {
    return (
      <View style={styles.center}>
        <View style={styles.check}><Text style={styles.checkTxt}>✓</Text></View>
        <Text style={font.h2}>¡Hecho!</Text>
        <Text style={[font.muted, { textAlign: 'center' }]}>
          La reserva de {reserva.invitadoNombre} ya está activa.
        </Text>
        <Boton titulo="Enviar por WhatsApp" onPress={compartir} />
        <Boton
          titulo="Terminar"
          variante="secundario"
          onPress={() => {
            setFase('formulario'); setReserva(null); setNombre(''); setTelefono(''); setInvitados(1);
          }}
        />
      </View>
    );
  }

  // --- Fase: confirmar ---
  if (fase === 'confirmar') {
    return (
      <View style={styles.center}>
        <Text style={font.muted}>Invitamos a:</Text>
        <Text style={styles.nombreGrande}>"{nombre.trim()}"</Text>
        <Text style={styles.telGrande}>{telefono.trim()}</Text>
        <View style={styles.filaBotones}>
          <View style={{ flex: 1 }}>
            <Boton titulo="No" variante="secundario" onPress={() => setFase('formulario')} />
          </View>
          <View style={{ flex: 1 }}>
            <Boton titulo="Sí" onPress={confirmar} cargando={enviando} />
          </View>
        </View>
        <Pressable onPress={() => setFase('formulario')}>
          <Text style={styles.cambiar}>Cambiar invitado</Text>
        </Pressable>
      </View>
    );
  }

  // --- Fase: formulario ---
  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
      <Text style={font.muted}>
        Para alguien que llegó sin la app: solo necesitas su nombre y teléfono. Podrá
        crear su cuenta en la app después si quiere.
      </Text>

      <Text style={styles.label}>Evento</Text>
      <View style={styles.chips}>
        {eventos.map((e) => (
          <Pressable key={e.id} style={[styles.chip, eventoId === e.id && styles.chipOn]} onPress={() => setEventoId(e.id)}>
            <Text style={[styles.chipTxt, eventoId === e.id && { color: colors.onAccent }]} numberOfLines={1}>{e.nombre}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Modalidad</Text>
      <View style={styles.chips}>
        {(['acceso', 'mesa'] as ModalidadReserva[]).map((m) => (
          <Pressable key={m} style={[styles.chip, modalidad === m && styles.chipOn]} onPress={() => setModalidad(m)}>
            <Text style={[styles.chipTxt, modalidad === m && { color: colors.onAccent }]}>{m === 'mesa' ? 'Mesa' : 'Acceso'}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Invitados (nº de QR)</Text>
      <View style={styles.stepper}>
        <Pressable style={styles.stepBtn} onPress={() => setInvitados((n) => Math.max(1, n - 1))}><Text style={styles.stepTxt}>−</Text></Pressable>
        <Text style={styles.stepValor}>{invitados}</Text>
        <Pressable style={styles.stepBtn} onPress={() => setInvitados((n) => Math.min(10, n + 1))}><Text style={styles.stepTxt}>+</Text></Pressable>
      </View>

      <Campo etiqueta="Nombre del invitado" value={nombre} onChangeText={setNombre} placeholder="Nombre completo" />
      <Campo etiqueta="Teléfono" value={telefono} onChangeText={setTelefono} placeholder="222 123 4567" keyboardType="phone-pad" />

      {error ? <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}

      <Boton titulo="Agregar invitado" onPress={() => validar() && setFase('confirmar')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.sm },
  label: { ...font.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingVertical: 8, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, maxWidth: '100%' },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipTxt: { color: colors.text, fontWeight: '700', fontSize: 13 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, alignSelf: 'flex-start' },
  stepBtn: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { color: colors.text, fontSize: 22, fontWeight: '800' },
  stepValor: { color: colors.text, fontSize: 22, fontWeight: '900', minWidth: 28, textAlign: 'center' },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  nombreGrande: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  telGrande: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  filaBotones: { flexDirection: 'row', gap: spacing.md, width: '100%', marginTop: spacing.md },
  cambiar: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  check: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  checkTxt: { color: colors.success, fontSize: 26, fontWeight: '900' },
});
