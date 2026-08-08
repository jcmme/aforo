import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton, Campo } from '@/components/ui';
import {
  listarMotivosAcceso,
  qrsDemoParaSimulador,
  registrarAccesoManual,
  validarPuerta,
} from '@/data/operacion';
import { colors, font, radius, semaforo as semColors, spacing } from '@/theme';
import type { ResultadoPuerta } from '@/types';

// Antro donde opera el personal. En real saldría de la membresía del usuario.
const ANTRO_ID = 'antro-1';

type Fase = 'escaneo' | 'resultado' | 'manual';

export default function EscanearScreen() {
  const [fase, setFase] = useState<Fase>('escaneo');
  const [resultado, setResultado] = useState<ResultadoPuerta | null>(null);
  const [motivos, setMotivos] = useState<string[]>([]);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const usarCamara = Platform.OS !== 'web';
  const simulador = qrsDemoParaSimulador(ANTRO_ID);

  useEffect(() => {
    listarMotivosAcceso().then(setMotivos);
  }, []);

  async function escanear(token: string) {
    const r = await validarPuerta(token, ANTRO_ID);
    setResultado(r);
    setFase('resultado');
  }

  function reiniciar() {
    setResultado(null);
    setFase('escaneo');
  }

  // --- Fase: escaneo ---
  if (fase === 'escaneo') {
    return (
      <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
        {usarCamara ? (
          <View style={styles.camaraBox}>
            {permiso?.granted ? (
              <CameraView
                style={styles.camara}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={({ data }) => fase === 'escaneo' && escanear(data)}
              />
            ) : (
              <View style={styles.camaraVacia}>
                <Text style={font.muted}>Se necesita acceso a la cámara para escanear.</Text>
                <Boton titulo="Permitir cámara" onPress={pedirPermiso} />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.aviso}>
            <Text style={font.muted}>
              En web no hay cámara: usa el simulador para probar el semáforo.
            </Text>
          </View>
        )}

        <Text style={styles.simTitulo}>Simulador de escaneo (demo)</Text>
        {simulador.map((q) => (
          <Pressable key={q.token} style={styles.simItem} onPress={() => escanear(q.token)}>
            <Text style={styles.simTxt}>{q.etiqueta}</Text>
          </Pressable>
        ))}
        <Pressable style={[styles.simItem, styles.simAjeno]} onPress={() => escanear('AFORO1.ajeno.demo')}>
          <Text style={styles.simTxt}>QR ajeno / inválido (probar rojo)</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // --- Fase: resultado (semáforo) ---
  if (fase === 'resultado' && resultado) {
    const color = semColors[resultado.semaforo];
    const titulo = resultado.semaforo === 'verde' ? 'ACCESO' : resultado.semaforo === 'amarillo' ? 'REVISAR' : 'NO PASA';
    return (
      <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
        <View style={[styles.semCard, { borderColor: color }]}>
          <View style={[styles.semBarra, { backgroundColor: color }]} />
          <Text style={[styles.semTitulo, { color }]}>{titulo}</Text>
          {resultado.motivo ? <Text style={font.muted}>{resultado.motivo}</Text> : null}

          {resultado.reservaNombre ? (
            <View style={styles.info}>
              <Dato etiqueta="Reserva" valor={resultado.reservaNombre} />
              <Dato etiqueta="RP" valor={resultado.rpNombre ?? '—'} />
              <Dato etiqueta="px esperados" valor={String(resultado.pxEsperados ?? '—')} />
              <Dato
                etiqueta="Distribuidos adentro"
                valor={`${resultado.adentro ?? 0}/${resultado.distribuidos ?? 0}${resultado.faltan ? ` · falta ${resultado.faltan}` : ''}`}
              />
            </View>
          ) : null}
        </View>

        {resultado.semaforo === 'amarillo' ? (
          <>
            <Boton
              titulo="Permitir de todos modos (override)"
              onPress={async () => {
                await registrarAccesoManual({
                  antroId: ANTRO_ID,
                  reservaId: resultado.reservaId,
                  qrId: resultado.qrId,
                  motivo: 'Override de amarillo',
                  override: true,
                });
                reiniciar();
              }}
            />
            <Boton titulo="No permitir" variante="secundario" onPress={reiniciar} />
          </>
        ) : resultado.semaforo === 'rojo' ? (
          <>
            <Boton titulo="Registrar acceso manual" variante="secundario" onPress={() => setFase('manual')} />
            <Boton titulo="Escanear otro" onPress={reiniciar} />
          </>
        ) : (
          <Boton titulo="Escanear otro" onPress={reiniciar} />
        )}
      </ScrollView>
    );
  }

  // --- Fase: acceso manual (6 motivos) ---
  return (
    <ManualForm
      motivos={motivos}
      onCancelar={reiniciar}
      onEnviar={async (motivo, nota) => {
        await registrarAccesoManual({ antroId: ANTRO_ID, reservaId: resultado?.reservaId, motivo, nota });
        reiniciar();
      }}
    />
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.datoRow}>
      <Text style={styles.datoEt}>{etiqueta}</Text>
      <Text style={styles.datoVal}>{valor}</Text>
    </View>
  );
}

function ManualForm({
  motivos,
  onCancelar,
  onEnviar,
}: {
  motivos: string[];
  onCancelar: () => void;
  onEnviar: (motivo: string, nota: string) => Promise<void>;
}) {
  const [motivo, setMotivo] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);
  const esOtro = motivo === motivos[motivos.length - 1];

  async function enviar() {
    if (!motivo) {
      setError('Elige un motivo.');
      return;
    }
    if (esOtro && !nota.trim()) {
      setError('El motivo "Otro" exige una explicación.');
      return;
    }
    await onEnviar(motivo, nota.trim());
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
      <Text style={font.h2}>Acceso manual</Text>
      <Text style={font.muted}>La persona es de la reserva pero el QR falló. Queda registrado.</Text>
      {motivos.map((m) => (
        <Pressable
          key={m}
          style={[styles.motivo, motivo === m && styles.motivoActivo]}
          onPress={() => setMotivo(m)}
        >
          <Text style={[styles.motivoTxt, motivo === m && { color: colors.primary }]}>{m}</Text>
        </Pressable>
      ))}
      <Campo
        etiqueta={esOtro ? 'Explicación (obligatoria)' : 'Nota (opcional)'}
        value={nota}
        onChangeText={setNota}
        placeholder="Detalle…"
        multiline
      />
      {error ? <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
      <Boton titulo="Registrar acceso" onPress={enviar} />
      <Boton titulo="Cancelar" variante="secundario" onPress={onCancelar} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  camaraBox: { height: 280, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  camara: { flex: 1 },
  camaraVacia: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  aviso: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  simTitulo: { ...font.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm },
  simItem: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  simAjeno: { borderColor: colors.danger },
  simTxt: { color: colors.text, fontSize: 14, fontWeight: '600' },
  semCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg, gap: spacing.sm, overflow: 'hidden' },
  semBarra: { position: 'absolute', top: 0, left: 0, right: 0, height: 8 },
  semTitulo: { fontSize: 36, fontWeight: '900', letterSpacing: 1, marginTop: spacing.sm },
  info: { marginTop: spacing.sm, gap: spacing.xs },
  datoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  datoEt: { color: colors.textMuted, fontSize: 13 },
  datoVal: { color: colors.text, fontSize: 14, fontWeight: '700' },
  motivo: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  motivoActivo: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  motivoTxt: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
