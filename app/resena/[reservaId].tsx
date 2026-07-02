import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Boton, Pantalla } from '@/components/ui';
import { obtenerEvento } from '@/data/eventos';
import { obtenerReserva } from '@/data/reservas';
import { crearResena } from '@/data/resenas';
import { colors, font, radius, spacing } from '@/theme';

/**
 * Reseña del cliente hacia el antro: estrellas + foto opcional (CLAUDE.md,
 * ronda 5). El comentario de texto queda listo en el modelo, sin UI todavía.
 */
export default function ResenaScreen() {
  const { reservaId } = useLocalSearchParams<{ reservaId: string }>();
  const router = useRouter();
  const [antroNombre, setAntroNombre] = useState('');
  const [antroId, setAntroId] = useState<string | null>(null);
  const [estrellas, setEstrellas] = useState(0);
  const [foto, setFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerReserva(reservaId).then(async (r) => {
      if (!r) return;
      setAntroId(r.antroId);
      const evento = await obtenerEvento(r.eventoId);
      setAntroNombre(evento?.nombre ?? 'este lugar');
    });
  }, [reservaId]);

  async function elegirFoto() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) return;
    const resultado = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!resultado.canceled && resultado.assets[0]) setFoto(resultado.assets[0].uri);
  }

  async function enviar() {
    if (!antroId || estrellas === 0) return;
    setEnviando(true);
    await crearResena(antroId, estrellas, foto);
    setEnviando(false);
    router.back();
  }

  return (
    <Pantalla>
      <View style={styles.content}>
        <Text style={font.kicker}>Calificar</Text>
        <Text style={font.h2}>{antroNombre}</Text>
        <Text style={font.muted}>Solo puedes calificar lugares donde ya verificamos tu llegada.</Text>

        <View style={styles.estrellas}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setEstrellas(n)} hitSlop={6}>
              <Text style={[styles.estrella, n <= estrellas && styles.estrellaOn]}>★</Text>
            </Pressable>
          ))}
        </View>

        {foto ? (
          <Image source={{ uri: foto }} style={styles.foto} />
        ) : (
          <Pressable style={styles.fotoVacia} onPress={elegirFoto}>
            <Text style={styles.fotoVaciaTxt}>Agregar foto (opcional)</Text>
          </Pressable>
        )}

        <Boton titulo="Publicar reseña" onPress={enviar} cargando={enviando} deshabilitado={estrellas === 0} />
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.xl, gap: spacing.lg, justifyContent: 'center' },
  estrellas: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  estrella: { fontSize: 40, color: colors.border },
  estrellaOn: { color: colors.accent },
  foto: { width: '100%', height: 180, borderRadius: radius.lg },
  fotoVacia: { height: 120, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  fotoVaciaTxt: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
});
