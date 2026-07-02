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
      <Stack.Screen name="feed-post/[id]" options={{ title: 'Publicación' }} />
      <Stack.Screen name="ranking" options={{ title: 'Ranking semanal' }} />
      <Stack.Screen name="perfil" options={{ title: 'Mi perfil' }} />
      <Stack.Screen name="nueva-reserva" options={{ title: 'Nueva reserva' }} />
      <Stack.Screen name="fantasmas" options={{ title: 'Detección de fantasmas' }} />
      <Stack.Screen name="metricas" options={{ title: 'Métricas' }} />
      <Stack.Screen name="cadena" options={{ title: 'Panel Cadena' }} />
      <Stack.Screen name="datos" options={{ title: 'Datos extraíbles' }} />
      <Stack.Screen name="invitaciones" options={{ title: 'Invitaciones' }} />
      <Stack.Screen name="tyc-antro" options={{ title: 'T&C del antro' }} />
      <Stack.Screen name="sa-parametros" options={{ title: 'Parámetros' }} />
      <Stack.Screen name="sa-promociones" options={{ title: 'Promociones' }} />
      <Stack.Screen name="sa-corporativos" options={{ title: 'Corporativos' }} />
      <Stack.Screen name="sa-planes" options={{ title: 'Planes y cobro' }} />
      <Stack.Screen name="sa-salud" options={{ title: 'Salud del producto' }} />
      <Stack.Screen name="sa-auditoria" options={{ title: 'Auditoría' }} />
      <Stack.Screen name="sa-tyc" options={{ title: 'Aprobar T&C' }} />
      <Stack.Screen name="rol" options={{ title: 'Cambiar rol', presentation: 'modal' }} />
    </Stack>
  );
}
