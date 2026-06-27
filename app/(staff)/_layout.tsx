import { Stack, useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { colors } from '@/theme';

/** Botón de cabecera para cambiar de rol (demo). */
function BotonRol() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push('/(staff)/rol')} hitSlop={10}>
      <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>Rol</Text>
    </Pressable>
  );
}

export default function StaffLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgAlt },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
        headerRight: () => <BotonRol />,
      }}
    >
      <Stack.Screen name="inicio" options={{ title: 'AFORO · Operación' }} />
      <Stack.Screen name="cadenero" options={{ title: 'Puerta · Cadenero' }} />
      <Stack.Screen name="escanear" options={{ title: 'Escanear QR' }} />
      <Stack.Screen name="contador" options={{ title: 'Contador' }} />
      <Stack.Screen name="hostess" options={{ title: 'Mesas' }} />
      <Stack.Screen name="capitan" options={{ title: 'Escanear mesa' }} />
      <Stack.Screen name="cajero-consumo" options={{ title: 'Capturar consumo' }} />
      <Stack.Screen name="cajero-minimos" options={{ title: 'C. Mínimos' }} />
      <Stack.Screen name="feed" options={{ title: 'Red social' }} />
      <Stack.Screen name="ranking" options={{ title: 'Ranking semanal' }} />
      <Stack.Screen name="perfil-rp" options={{ title: 'Mi perfil' }} />
      <Stack.Screen name="fantasmas" options={{ title: 'Detección de fantasmas' }} />
      <Stack.Screen name="rol" options={{ title: 'Cambiar rol', presentation: 'modal' }} />
    </Stack>
  );
}
