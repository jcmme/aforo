import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Boton } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { obtenerTycAntro, proponerTyc } from '@/data/tyc';
import { colors, font, radius, spacing } from '@/theme';
import type { TycAntro } from '@/types';

// Antro donde opera el personal (igual que el resto de pantallas de staff).
const ANTRO_ID = 'antro-1';

/**
 * El responsable DESIGNADO de un antro edita su T&C corto. Puede editar
 * siempre; el corte semanal (martes 12:00) solo decide cuándo aplica el
 * cambio, tras la aprobación del Súper Admin.
 */
export default function TycAntroScreen() {
  const { usuario, demo } = useAuth();
  const [tyc, setTyc] = useState<TycAntro | null>(null);
  const [texto, setTexto] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerTycAntro(ANTRO_ID).then((t) => {
      setTyc(t);
      setTexto(t?.textoPendiente ?? t?.textoVigente ?? '');
    });
  }, []);

  // En demo, cualquier persona con la acción puede probar la pantalla; en
  // real solo el responsable asignado (antros.responsable_tyc_id) puede editar.
  const esResponsable = demo || tyc?.responsableId === usuario?.id;

  async function guardar() {
    setGuardando(true);
    await proponerTyc(ANTRO_ID, texto.trim());
    setTyc(await obtenerTycAntro(ANTRO_ID));
    setGuardando(false);
    setEnviado(true);
  }

  if (!esResponsable) {
    return (
      <View style={styles.center}>
        <Text style={font.h3}>No eres el responsable de T&C</Text>
        <Text style={font.muted}>
          {tyc?.responsableNombre ? `Esa persona es ${tyc.responsableNombre}.` : 'Aún no hay nadie asignado a este antro.'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.muted}>
        Texto corto que ven los clientes al reservar en este antro. Todo cambio requiere
        el visto bueno del Súper Admin. Si se aprueba antes del corte semanal (martes
        12:00), aplica esta semana; si no, se pospone a la siguiente.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Vigente ahora</Text>
        <Text style={font.body}>{tyc?.textoVigente || '—'}</Text>
      </View>

      {tyc?.estado === 'esperando_aprobacion' ? (
        <View style={[styles.card, styles.pendiente]}>
          <Text style={styles.labelPendiente}>Esperando aprobación del Súper Admin</Text>
          <Text style={font.body}>{tyc.textoPendiente}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>Proponer nuevo texto</Text>
      <TextInput
        value={texto}
        onChangeText={setTexto}
        multiline
        style={styles.textarea}
        placeholder="Ej. Cover no reembolsable. Acceso solo con identificación vigente."
        placeholderTextColor={colors.textFaint}
      />
      {enviado ? <Text style={styles.ok}>Enviado a revisión del Súper Admin.</Text> : null}
      <Boton titulo="Enviar a aprobación" onPress={guardar} cargando={guardando} deshabilitado={!texto.trim()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.xl },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 4 },
  pendiente: { borderColor: colors.accent },
  label: { ...font.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  labelPendiente: { color: colors.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  textarea: { minHeight: 100, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, padding: spacing.md, fontSize: 14, textAlignVertical: 'top' },
  ok: { color: colors.success, fontSize: 13, fontWeight: '700' },
});
