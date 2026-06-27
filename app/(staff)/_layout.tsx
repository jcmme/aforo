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
      <Stack.Screen name="cadenero" options={{ title: 'Puerta · Cadenero' }} />
      <Stack.Screen name="escanear" options={{ title: 'Escanear QR' }} />
      <Stack.Screen name="contador" options={{ title: 'Contador' }} />
      <Stack.Screen name="hostess" options={{ title: 'Hostess · Mesas' }} />
      <Stack.Screen name="capitan" options={{ title: 'Capitán · Mesa' }} />
      <Stack.Screen name="rol" options={{ title: 'Cambiar rol', presentation: 'modal' }} />
    </Stack>
  );
}
