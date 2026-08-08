import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/ui';
import { obtenerEvento } from '@/data/eventos';
import { colors, font, radius, spacing } from '@/theme';
import type { Evento } from '@/types';

const FORMATO: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
};

export default function EventoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerEvento(id)
      .then(setEvento)
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!evento) {
    return (
      <View style={styles.center}>
        <Text style={font.muted}>Evento no encontrado.</Text>
      </View>
    );
  }

  const ocupados = evento.lugaresOcupados ?? 0;
  const lleno = ocupados >= evento.cupoMaximo;
  const ctaTitulo = lleno
    ? evento.alLlenar === 'lista_espera'
      ? 'Unirme a la lista de espera'
      : 'Evento lleno'
    : 'Reservar';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: evento.fotos[0] }} style={styles.hero} resizeMode="cover" />
        <View style={styles.body}>
          <Text style={font.kicker}>{new Date(evento.fecha).toLocaleString('es-MX', FORMATO)}</Text>
          <Text style={font.title}>{evento.nombre}</Text>
          {evento.descripcion ? <Text style={styles.desc}>{evento.descripcion}</Text> : null}

          <View style={styles.card}>
            <Dato etiqueta="Modalidades" valor={evento.modalidades.map((m) => (m === 'mesa' ? 'Mesa' : 'Acceso')).join(' · ')} />
            <Dato etiqueta="Cupo" valor={`${ocupados} / ${evento.cupoMaximo}`} />
            <Dato etiqueta="Al llenarse" valor={evento.alLlenar === 'lista_espera' ? 'Lista de espera' : 'Cerrar'} />
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Boton
          titulo={ctaTitulo}
          onPress={() => router.push(`/reservar/${evento.id}`)}
          deshabilitado={lleno && evento.alLlenar === 'cerrar'}
        />
      </View>
    </View>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: spacing.xxl },
  hero: { width: '100%', height: 260, backgroundColor: colors.surfaceAlt },
  body: { padding: spacing.lg, gap: spacing.xs },
  desc: { ...font.body, marginTop: spacing.sm, lineHeight: 22 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  dato: { flexDirection: 'row', justifyContent: 'space-between' },
  datoEtiqueta: { color: colors.textMuted, fontSize: 13 },
  datoValor: { color: colors.text, fontSize: 14, fontWeight: '700' },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
