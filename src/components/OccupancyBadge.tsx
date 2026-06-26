import { StyleSheet, Text, View } from 'react-native';

import { occupancy, radius, spacing } from '@/theme';
import type { OccupancyLevel } from '@/types';

/** Insignia con el semáforo de aforo (vacío / moderado / lleno). */
export function OccupancyBadge({
  level,
  size = 'md',
}: {
  level: OccupancyLevel;
  size?: 'sm' | 'md';
}) {
  const { label, color } = occupancy[level];
  return (
    <View style={[styles.badge, size === 'sm' && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  badgeSm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
