import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/context/AuthContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.accent,
            headerTitleStyle: { fontWeight: '700', color: colors.text },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(cliente)" options={{ headerShown: false }} />
          <Stack.Screen name="(staff)" options={{ headerShown: false }} />
          <Stack.Screen name="antro/[id]" options={{ title: '' }} />
          <Stack.Screen name="evento/[id]" options={{ title: '' }} />
          <Stack.Screen name="reservar/[eventoId]" options={{ title: 'Reservar' }} />
          <Stack.Screen
            name="reserva/[id]"
            options={{ title: 'Tu reserva', headerBackVisible: false }}
          />
          <Stack.Screen name="reclamar/[token]" options={{ title: 'Reclamar acceso' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
