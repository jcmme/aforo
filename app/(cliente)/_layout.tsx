import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

/** Indicador de pestaña minimalista: punto de acento + etiqueta sobria. */
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={styles.tab}>
      <View style={[styles.punto, focused && styles.puntoOn]} />
      <Text style={[styles.label, focused && styles.labelOn]}>{label}</Text>
    </View>
  );
}

export default function ClienteLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        tabBarShowLabel: false,
        tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: colors.border, height: 64, paddingTop: 8 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Explorar', tabBarIcon: ({ focused }) => <TabIcon label="Explorar" focused={focused} /> }} />
      <Tabs.Screen name="reservas" options={{ title: 'Mis reservas', tabBarIcon: ({ focused }) => <TabIcon label="Reservas" focused={focused} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ focused }) => <TabIcon label="Perfil" focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tab: { alignItems: 'center', gap: 5, width: 80 },
  punto: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent' },
  puntoOn: { backgroundColor: colors.accent },
  label: { fontSize: 12, fontWeight: '600', color: colors.textFaint, letterSpacing: 0.2 },
  labelOn: { color: colors.text },
});
