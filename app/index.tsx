import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

/**
 * Punto de entrada: enruta según la sesión. Toda cuenta nace cliente, así que
 * por ahora la app autenticada va al grupo (cliente). La navegación por rol se
 * ampliará con las vistas de personal en las secciones 2-4.
 */
export default function Index() {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={usuario ? '/(cliente)' : '/(auth)/login'} />;
}
