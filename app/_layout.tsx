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
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '800' },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'AFORO' }} />
          <Stack.Screen
            name="venue/[id]"
            options={{ title: '', headerTransparent: true }}
          />
          <Stack.Screen
            name="admin/index"
            options={{ title: 'Mi lugar' }}
          />
          <Stack.Screen
            name="(auth)/login"
            options={{ title: 'Entrar', presentation: 'modal' }}
          />
          <Stack.Screen
            name="(auth)/register"
            options={{ title: 'Crear cuenta', presentation: 'modal' }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
