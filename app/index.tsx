import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';
import type { Rol } from '@/types';

/**
 * Ruta de inicio según el rol activo. El cadenero va directo a su vista mínima
 * de dos botones; el resto del personal entra a su tablero de tarjetas.
 */
const HOME_POR_ROL: Partial<Record<Rol, string>> = {
  cadenero: '/(staff)/cadenero',
  hostess: '/(staff)/inicio',
  capitan: '/(staff)/inicio',
  cajero: '/(staff)/inicio',
  rp: '/(staff)/inicio',
  gerente: '/(staff)/inicio',
  gerente_general: '/(staff)/inicio',
  super_admin: '/(staff)/inicio',
};

/**
 * Punto de entrada: enruta según sesión y rol. Toda cuenta nace cliente; el
 * personal entra por invitación (en demo, con el selector de rol).
 */
export default function Index() {
  const { usuario, rolActivo, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!usuario) return <Redirect href="/(auth)/login" />;

  const destinoStaff = HOME_POR_ROL[rolActivo];
  return <Redirect href={(destinoStaff ?? '/(cliente)') as never} />;
}
