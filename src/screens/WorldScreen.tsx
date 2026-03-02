import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHotspots, getHotspotsMetadata, getEventsForHotspot } from '../data/loader';
import { formatTimeUTC, formatDateTimeUTC, severityLabel, eventTypeLabel, sourceLabel } from '../utils/format';
import type { Hotspot, EventDetail } from '../types/event';
import { COLORS, SPACING, FONT, RADIUS } from '../theme';

const DENSITY_OPTIONS = [25, 50, 100] as const;
type Density = (typeof DENSITY_OPTIONS)[number];

type ExpandedPanel = 'events' | 'fatalities' | null;

const SEVERITY_COLOR: Record<string, string> = {
  high: COLORS.severityHigh,
  medium: COLORS.severityMedium,
  low: COLORS.severityLow,
};

const WORLD_REGION = {
  latitude: 20,
  longitude: 20,
  latitudeDelta: 120,
  longitudeDelta: 140,
};

export function WorldScreen() {
  const mapRef = useRef<MapView>(null);
  const [density, setDensity] = useState<Density>(25);
  const [allHotspots] = useState<Hotspot[]>(getHotspots());
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>(null);
  const [events, setEvents] = useState<EventDetail[]>([]);

  useEffect(() => {
    const meta = getHotspotsMetadata();
    setLastUpdated(formatTimeUTC(meta.generated));
  }, []);

  function selectHotspot(h: Hotspot) {
    setSelectedHotspot(h);
    setExpandedPanel(null);
    setEvents(getEventsForHotspot(h.id));
  }

  function togglePanel(panel: ExpandedPanel) {
    setExpandedPanel(prev => (prev === panel ? null : panel));
  }

  // Sort by severity + event count, then slice to density
  const displayed = allHotspots
    .slice()
    .sort((a, b) => {
      const sev = { high: 3, medium: 2, low: 1 };
      const diff = (sev[b.severity] ?? 0) - (sev[a.severity] ?? 0);
      if (diff !== 0) return diff;
      return b.event_count - a.event_count;
    })
    .slice(0, density);

  const fatalityEvents = events.filter(e => e.fatalities > 0);
  const listEvents = expandedPanel === 'fatalities' ? fatalityEvents : events;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          initialRegion={WORLD_REGION}
          mapType="standard"
          userInterfaceStyle="dark"
          showsUserLocation={false}
        >
          {displayed.map((h) => (
            <Marker
              key={h.id}
              coordinate={{ latitude: h.lat, longitude: h.lon }}
              title={h.label}
              description={`${severityLabel(h.severity)} · ${h.event_count} events`}
              pinColor={SEVERITY_COLOR[h.severity] ?? COLORS.textMuted}
              onPress={() => selectHotspot(h)}
            />
          ))}
        </MapView>

        {/* Overlay: density selector */}
        <View style={styles.densityOverlay}>
          <Text style={styles.densityLabel}>Top</Text>
          {DENSITY_OPTIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.densityBtn, density === d && styles.densityBtnActive]}
              onPress={() => setDensity(d)}
            >
              <Text
                style={[
                  styles.densityBtnText,
                  density === d && styles.densityBtnTextActive,
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Source status */}
        <View style={styles.statusOverlay}>
          <View style={[styles.dot, { backgroundColor: COLORS.severityLow }]} />
          <Text style={styles.statusText}>Source OK  ·  {lastUpdated}</Text>
        </View>
      </View>

      {/* Detail panel */}
      <View style={styles.panel}>
        {selectedHotspot ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View
                  style={[
                    styles.severityPill,
                    { backgroundColor: SEVERITY_COLOR[selectedHotspot.severity] + '22' },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityPillText,
                      { color: SEVERITY_COLOR[selectedHotspot.severity] },
                    ]}
                  >
                    {severityLabel(selectedHotspot.severity)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedHotspot(null)}>
                  <Text style={styles.dismissText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.detailTitle}>{selectedHotspot.label}</Text>
              <Text style={styles.detailSub}>
                {selectedHotspot.country_name}  ·  {eventTypeLabel(selectedHotspot.type)}
              </Text>

              <View style={styles.statsRow}>
                {/* Events stat — tappable */}
                <TouchableOpacity
                  style={[
                    styles.statItem,
                    expandedPanel === 'events' && styles.statItemActive,
                  ]}
                  onPress={() => togglePanel('events')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.statValue}>{selectedHotspot.event_count}</Text>
                  <Text style={styles.statLabel}>Events (7d)</Text>
                  <Text style={styles.statChevron}>
                    {expandedPanel === 'events' ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {/* Fatalities stat — tappable */}
                <TouchableOpacity
                  style={[
                    styles.statItem,
                    expandedPanel === 'fatalities' && styles.statItemActive,
                  ]}
                  onPress={() => togglePanel('fatalities')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.statValue}>{selectedHotspot.fatalities}</Text>
                  <Text style={styles.statLabel}>Fatalities</Text>
                  <Text style={styles.statChevron}>
                    {expandedPanel === 'fatalities' ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {/* Source — non-interactive, friendly label */}
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, styles.statValueSm]}>
                    {sourceLabel(selectedHotspot.source)}
                  </Text>
                  <Text style={styles.statLabel}>Source</Text>
                </View>
              </View>

              {/* Expanded event list */}
              {expandedPanel !== null && (
                <View style={styles.eventList}>
                  {expandedPanel === 'fatalities' && fatalityEvents.length === 0 ? (
                    <Text style={styles.emptyText}>No recorded fatalities in this window.</Text>
                  ) : listEvents.length === 0 ? (
                    <Text style={styles.emptyText}>No detailed events available.</Text>
                  ) : (
                    listEvents.map((ev) => (
                      <View key={ev.id} style={styles.eventRow}>
                        <View style={styles.eventRowHeader}>
                          <Text style={styles.eventType}>{eventTypeLabel(ev.type)}</Text>
                          {ev.fatalities > 0 && (
                            <Text style={styles.eventFatalities}>
                              {ev.fatalities} {ev.fatalities === 1 ? 'fatality' : 'fatalities'}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.eventTime}>{formatDateTimeUTC(ev.event_time)}</Text>
                        <Text style={styles.eventDesc}>{ev.description}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}

              <Text style={styles.disclaimer}>
                Data is informational and does not replace official safety guidance.
              </Text>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>
              Showing top {density} areas by activity level
            </Text>
            <Text style={styles.hintSub}>Tap a marker for details</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapContainer: {
    flex: 0.55,
    overflow: 'hidden',
  },
  densityOverlay: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.mapOverlay,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  densityLabel: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
    marginRight: 2,
  },
  densityBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  densityBtnActive: {
    backgroundColor: COLORS.accentSubtle,
  },
  densityBtnText: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  densityBtnTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  statusOverlay: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.mapOverlay,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
  },
  panel: {
    flex: 0.45,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  hintContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  hintText: {
    fontSize: FONT.sizeMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  hintSub: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  detailCard: {
    padding: SPACING.md,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  severityPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  severityPillText: {
    fontSize: FONT.sizeSm,
    fontWeight: '600',
  },
  dismissText: {
    fontSize: FONT.sizeLg,
    color: COLORS.textMuted,
    padding: SPACING.xs,
  },
  detailTitle: {
    fontSize: FONT.sizeLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  detailSub: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  statItemActive: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSubtle,
  },
  statValue: {
    fontSize: FONT.sizeLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statValueSm: {
    fontSize: FONT.sizeSm,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statChevron: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  eventList: {
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  eventRow: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    gap: 3,
  },
  eventRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventType: {
    fontSize: FONT.sizeSm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  eventFatalities: {
    fontSize: FONT.sizeSm,
    color: COLORS.severityHigh,
    fontWeight: '600',
  },
  eventTime: {
    fontSize: FONT.sizeSm - 1,
    color: COLORS.textMuted,
  },
  eventDesc: {
    fontSize: FONT.sizeSm,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: SPACING.sm,
  },
  disclaimer: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
