import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton, Campo } from '@/components/ui';
import {
  acusarPromo,
  escanearMesa,
  invitarARetirarse,
  moverMesa,
  qrsDemoParaSimulador,
} from '@/data/operacion';
import { colors, font, radius, spacing } from '@/theme';
import type { EscaneoMesa } from '@/types';

const ANTRO_ID = 'antro-1';

export default function CapitanScreen() {
  const [escaneo, setEscaneo] = useState<EscaneoMesa | null>(null);
  const [mesa, setMesa] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const usarCamara = Platform.OS !== 'web';
  const simulador = qrsDemoParaSimulador(ANTRO_ID);

  async function escanear(token: string) {
    setAviso(null);
    const r = await escanearMesa(token, ANTRO_ID);
    if (!r) setAviso('QR no corresponde a ninguna reserva.');
    setEscaneo(r);
  }

  if (!escaneo) {
    return (
      <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
        <Text style={font.kicker}>Escaneo de mesa</Text>
        <Text style={font.muted}>
          Solo el capitán escanea en mesa. Trae la promo, la mesa y el RP de la reserva.
          Este escaneo NO sirve para entrar por puerta.
        </Text>

        {usarCamara && permiso?.granted ? (
          <View style={styles.camaraBox}>
            <CameraView
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => !escaneo && escanear(data)}
            />
          </View>
        ) : usarCamara ? (
          <Boton titulo="Permitir cámara" onPress={pedirPermiso} />
        ) : null}

        <Text style={styles.simTitulo}>Simulador (demo)</Text>
        {simulador.map((q) => (
          <Pressable key={q.token} style={styles.simItem} onPress={() => escanear(q.token)}>
            <Text style={styles.simTxt}>{q.etiqueta}</Text>
          </Pressable>
        ))}
        {aviso ? <Text style={{ color: colors.danger, fontSize: 13 }}>{aviso}</Text> : null}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={font.h2}>{escaneo.reservaNombre}</Text>
        <Dato etiqueta="RP" valor={escaneo.rpNombre ?? '—'} />
        <Dato etiqueta="Mesa actual" valor={escaneo.mesaActual ?? 'Sin asignar'} />
        <Dato
          etiqueta="Consumo mínimo"
          valor={escaneo.consumoMinimo ? `$${escaneo.consumoMinimo.toLocaleString('es-MX')}` : 'No aplica'}
        />
      </View>

      {escaneo.promo ? (
        <View style={styles.promo}>
          <Text style={styles.promoEt}>Promo preautorizada</Text>
          <Text style={styles.promoTxt}>{escaneo.promo}</Text>
          {aviso === 'promo' ? (
            <Text style={styles.ok}>Acuse registrado</Text>
          ) : (
            <Boton
              titulo="Marcar promo aplicada"
              onPress={async () => {
                await acusarPromo(escaneo.reservaId, escaneo.promo!);
                setAviso('promo');
              }}
            />
          )}
        </View>
      ) : null}

      {escaneo.consumoMinimo ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>Consumo mínimo</Text>
          <Text style={font.muted}>Si la mesa no cumple, cámbiala a una menos exclusiva o invita a retirarse.</Text>
          <Campo etiqueta="Cambiar a mesa" value={mesa} onChangeText={setMesa} placeholder="Ej. Barra 3" />
          <Boton
            titulo="Cambiar mesa"
            variante="secundario"
            onPress={async () => {
              if (!mesa.trim()) return;
              await moverMesa(escaneo.reservaId, mesa.trim());
              setEscaneo({ ...escaneo, mesaActual: mesa.trim() });
              setMesa('');
            }}
          />
          <Boton
            titulo="Invitar a retirarse"
            variante="peligro"
            onPress={async () => {
              await invitarARetirarse(escaneo.reservaId, 'Mesa no cumple el consumo mínimo');
              setAviso('Registrado en incidencias (panel Cadena).');
              setEscaneo(null);
            }}
          />
        </View>
      ) : null}

      <Boton titulo="Escanear otra mesa" onPress={() => { setEscaneo(null); setAviso(null); }} />
    </ScrollView>
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

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  camaraBox: { height: 260, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  simTitulo: { ...font.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm },
  simItem: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  simTxt: { color: colors.text, fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  datoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  datoEt: { color: colors.textMuted, fontSize: 13 },
  datoVal: { color: colors.text, fontSize: 14, fontWeight: '700' },
  promo: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary, padding: spacing.md, gap: spacing.sm },
  promoEt: { color: colors.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  promoTxt: { color: colors.text, fontSize: 16, fontWeight: '700' },
  seccion: { ...font.h3 },
  ok: { color: colors.success, fontWeight: '800' },
});
