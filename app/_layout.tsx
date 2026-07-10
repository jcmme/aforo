import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/context/AuthContext';
import { aplicarFuenteBase, fuentesAforo } from '@/lib/fuentes';
import { colors, familias } from '@/theme';

// Fuente base uniforme (Jost) para todo Text/TextInput; se aplica una vez.
aplicarFuenteBase();

export default function RootLayout() {
  const [fuentesListas] = useFonts(fuentesAforo);

  // Evita el "flash" de fuente del sistema: fondo negro hasta que cargan.
  if (!fuentesListas) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: familias.sansSemi, color: colors.text },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(cliente)" options={{ headerShown: false }} />
          <Stack.Screen name="(staff)" options={{ headerShown: false }} />
          <Stack.Screen name="promociones" options={{ title: 'Promociones' }} />
          <Stack.Screen name="bienvenida" options={{ headerShown: false }} />
          <Stack.Screen name="privacidad" options={{ title: 'Políticas y privacidad' }} />
          <Stack.Screen name="ajustes-privacidad" options={{ title: 'Ajustes de privacidad' }} />
          <Stack.Screen name="antro/[id]" options={{ title: '' }} />
          <Stack.Screen name="evento/[id]" options={{ title: '' }} />
          <Stack.Screen name="reservar/[eventoId]" options={{ title: 'Reservar' }} />
          <Stack.Screen
            name="reserva/[id]"
            options={{ title: 'Tu reserva', headerBackVisible: false }}
          />
          <Stack.Screen name="reclamar/[token]" options={{ title: 'Tu acceso' }} />
          <Stack.Screen name="resena/[reservaId]" options={{ title: 'Calificar', presentation: 'modal' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
