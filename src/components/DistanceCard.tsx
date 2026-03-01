import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT, RADIUS } from '../theme';
import { formatKm } from '../utils/format';

interface DistanceCardProps {
  from: string;
  to: string;
  distanceKm: number;
  lineColor?: string;
  note?: string;
}

export function DistanceCard({
  from,
  to,
  distanceKm,
  lineColor = COLORS.line,
  note,
}: DistanceCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.colorBar, { backgroundColor: lineColor }]} />
      <View style={styles.content}>
        <Text style={styles.route} numberOfLines={1}>
          {from}{'  ↔  '}{to}
        </Text>
        <Text style={styles.distance}>{formatKm(distanceKm)}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  colorBar: {
    width: 4,
    backgroundColor: COLORS.line,
  },
  content: {
    flex: 1,
    padding: SPACING.sm,
  },
  route: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  distance: {
    fontSize: FONT.sizeXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  note: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
