import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Hotspot } from '../types/event';
import { COLORS, SPACING, FONT, RADIUS } from '../theme';
import { formatKm, relativeTime, eventTypeLabel } from '../utils/format';

interface HotspotRowProps {
  hotspot: Hotspot;
  rank: number;
}

const SEVERITY_COLOR: Record<string, string> = {
  high: COLORS.severityHigh,
  medium: COLORS.severityMedium,
  low: COLORS.severityLow,
};

export function HotspotRow({ hotspot, rank }: HotspotRowProps) {
  const color = SEVERITY_COLOR[hotspot.severity] ?? COLORS.textMuted;
  return (
    <View style={styles.row}>
      <View style={[styles.rankBadge, { borderColor: color }]}>
        <Text style={[styles.rankText, { color }]}>{rank}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label} numberOfLines={1}>
          {hotspot.label}
        </Text>
        <Text style={styles.sub}>
          {eventTypeLabel(hotspot.type)}
          {hotspot.fatalities > 0
            ? `  ·  ${hotspot.fatalities} fatalities reported`
            : ''}
        </Text>
        <Text style={styles.meta}>
          {relativeTime(hotspot.last_event)}  ·  {hotspot.event_count} events
        </Text>
      </View>
      {hotspot.distance_km != null && (
        <Text style={styles.distance}>{formatKm(hotspot.distance_km)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  rankText: {
    fontSize: FONT.sizeSm,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: FONT.sizeMd,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  sub: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  meta: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  distance: {
    fontSize: FONT.sizeMd,
    color: COLORS.accent,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
});
