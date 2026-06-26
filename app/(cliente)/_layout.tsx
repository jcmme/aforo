import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors } from '@/theme';

/** Icono de texto simple (sin emoji, CLAUDE.md §9). */
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: '800', color: focused ? colors.primary : colors.textFaint, letterSpacing: 0.5 }}>
      {label}
    </Text>
  );
}

export default function ClienteLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ focused }) => <TabIcon label="ANTROS" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Mis reservas',
          tabBarIcon: ({ focused }) => <TabIcon label="RESERVAS" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon label="PERFIL" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
