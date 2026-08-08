import * as Clipboard from 'expo-clipboard';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { generarInvitacion, listarInvitaciones, revocarInvitacion, rolesInvitables } from '@/data/invitaciones';
import { colors, font, radius, spacing } from '@/theme';
import type { Invitacion, Rol } from '@/types';

const CORP_ID = 'corp-1';
const ANTRO_ID = 'antro-1';

const NOMBRE_ROL: Record<string, string> = {
  rp: 'RP', capitan: 'Capitán', hostess: 'Hostess', cajero: 'Cajero', cadenero: 'Cadenero',
  gerente: 'Gerente', gerente_general: 'Gerente general', dueno: 'Dueño', socio: 'Socio',
};

/** Alta de personal por invitación (escalera: nadie invita a un rango ≥). */
export default function InvitacionesScreen() {
  const { rolActivo } = useAuth();
  const invitables = rolesInvitables(rolActivo);
  const [rolSel, setRolSel] = useState<Rol | null>(invitables[0] ?? null);
  const [masivo, setMasivo] = useState(false);
  const [lista, setLista] = useState<Invitacion[]>([]);
  const [generada, setGenerada] = useState<Invitacion | null>(null);

  const cargar = useCallback(() => {
    listarInvitaciones(CORP_ID).then(setLista);
  }, []);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function generar() {
    if (!rolSel) return;
    const inv = await generarInvitacion({ rol: rolSel, antroId: ANTRO_ID, corporativoId: CORP_ID, usosMax: masivo ? 40 : 1 });
    setGenerada(inv);
    cargar();
  }

  if (invitables.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={font.muted}>Tu rol no puede generar invitaciones.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={font.muted}>
        Generar la invitación ES la aprobación. Código no adivinable, con caducidad (72h).
        Puedes revocar al instante. Nadie invita a un rango igual o superior.
      </Text>

      <Text style={styles.label}>Rol a invitar</Text>
      <View style={styles.roles}>
        {invitables.map((r) => (
          <Pressable key={r} style={[styles.rolChip, rolSel === r && styles.rolChipActivo]} onPress={() => setRolSel(r)}>
            <Text style={[styles.rolTxt, rolSel === r && { color: colors.onAccent }]}>{NOMBRE_ROL[r] ?? r}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.checkRow} onPress={() => setMasivo((v) => !v)}>
        <View style={[styles.check, masivo && styles.checkOn]}>{masivo ? <Text style={styles.checkTxt}>✓</Text> : null}</View>
        <Text style={font.body}>Reclutamiento masivo (hasta 40 usos)</Text>
      </Pressable>

      <Boton titulo="Generar invitación" onPress={generar} />

      {generada ? (
        <View style={styles.generada}>
          <Text style={styles.generadaEt}>Código generado ({NOMBRE_ROL[generada.rol] ?? generada.rol})</Text>
          <Text style={styles.codigo}>{generada.codigo}</Text>
          <Boton titulo="Copiar código" variante="secundario" onPress={() => Clipboard.setStringAsync(generada.codigo)} />
        </View>
      ) : null}

      <Text style={styles.label}>Invitaciones activas</Text>
      {lista.length === 0 ? <Text style={font.muted}>Aún no has generado invitaciones.</Text> : null}
      {lista.map((i) => (
        <View key={i.id} style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.codigoChico}>{i.codigo}</Text>
            <Text style={font.muted}>
              {NOMBRE_ROL[i.rol] ?? i.rol} · {i.usos}/{i.usosMax} usos
              {i.revocada ? ' · revocada' : ''}
            </Text>
          </View>
          {!i.revocada ? (
            <Pressable onPress={async () => { await revocarInvitacion(i.id); cargar(); }}>
              <Text style={styles.revocar}>Revocar</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  label: { ...font.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  rolChip: { paddingVertical: 8, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  rolChipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  rolTxt: { color: colors.text, fontWeight: '700', fontSize: 13 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  check: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkTxt: { color: colors.onAccent, fontWeight: '900' },
  generada: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary, padding: spacing.md, gap: spacing.sm, alignItems: 'center' },
  generadaEt: { color: colors.primary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  codigo: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  codigoChico: { color: colors.text, fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  revocar: { color: colors.danger, fontWeight: '800', fontSize: 13 },
});
