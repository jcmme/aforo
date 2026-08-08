import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton, Campo, Pantalla } from '@/components/ui';
import { motivosReporteContenido, reportarResena } from '@/data/resenas';
import { colors, familias, radius, spacing } from '@/theme';

/**
 * Reporte de una reseña/foto que incumple las Normas de la Comunidad
 * (Términos y Condiciones, Secciones 8-10). Mismo patrón que el acceso
 * manual en puerta: motivos configurables, "Otro" exige nota.
 */
export default function ReportarResenaScreen() {
  const { resenaId } = useLocalSearchParams<{ resenaId: string }>();
  const router = useRouter();
  const [motivos, setMotivos] = useState<string[]>([]);
  const [motivo, setMotivo] = useState('');
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    motivosReporteContenido().then(setMotivos);
  }, []);

  const motivoOtro = motivos[motivos.length - 1];
  const notaObligatoria = motivo !== '' && motivo === motivoOtro;

  async function enviar() {
    setError(null);
    if (!motivo) {
      setError('Elige un motivo.');
      return;
    }
    if (notaObligatoria && !nota.trim()) {
      setError('Explica brevemente qué está mal.');
      return;
    }
    setEnviando(true);
    try {
      await reportarResena(resenaId, motivo, nota.trim() || null);
      setEnviado(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el reporte.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <Pantalla>
        <View style={styles.confirmacion}>
          <Text style={styles.confirmacionTitulo}>Gracias por avisarnos</Text>
          <Text style={styles.confirmacionTexto}>
            Lo va a revisar el equipo del antro. No es necesario que hagas nada más.
          </Text>
          <Boton titulo="Listo" onPress={() => router.back()} />
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>¿Qué está mal con esta reseña?</Text>
        <View style={styles.opciones}>
          {motivos.map((m) => (
            <Pressable key={m} style={[styles.opcion, motivo === m && styles.opcionActiva]} onPress={() => setMotivo(m)}>
              <View style={[styles.radio, motivo === m && styles.radioOn]} />
              <Text style={[styles.opcionTexto, motivo === m && styles.opcionTextoActivo]}>{m}</Text>
            </Pressable>
          ))}
        </View>

        <Campo
          etiqueta={notaObligatoria ? 'Explica qué pasó (obligatorio)' : 'Nota (opcional)'}
          value={nota}
          onChangeText={setNota}
          placeholder="Cuéntanos brevemente"
          multiline
          numberOfLines={3}
          style={styles.nota}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Boton titulo="Enviar reporte" onPress={enviar} cargando={enviando} deshabilitado={!motivo} />
      </ScrollView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  titulo: { color: colors.text, fontFamily: familias.medium, fontSize: 18 },
  opciones: { gap: spacing.sm },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  opcionActiva: { borderColor: colors.accent, backgroundColor: colors.surfaceAlt },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.border },
  radioOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  opcionTexto: { color: colors.textMuted, fontFamily: familias.regular, fontSize: 14, flexShrink: 1 },
  opcionTextoActivo: { color: colors.text },
  nota: { minHeight: 80, textAlignVertical: 'top', paddingTop: spacing.sm },
  error: { color: colors.danger, fontSize: 13 },
  confirmacion: { flex: 1, padding: spacing.xl, gap: spacing.md, justifyContent: 'center', alignItems: 'center' },
  confirmacionTitulo: { color: colors.text, fontFamily: familias.medium, fontSize: 20, textAlign: 'center' },
  confirmacionTexto: { color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
