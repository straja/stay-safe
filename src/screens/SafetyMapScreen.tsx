/**
 * Country Safety Map Screen
 *
 * Displays a world choropleth map with countries shaded by official travel
 * advisory level derived from Government of Canada advisories.
 *
 * Design principles (CLAUDE.md):
 * - Neutral language: "advisory level", not "danger"
 * - No flashing, no alarmism
 * - Disclaimer always visible
 * - Privacy: no user location sent
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import MapView, { Polygon, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { refreshAll, getLevelForIso2 } from '../services/safetyService';
import type { CountrySafety, CountryFeature, SafetyLevel } from '../types/safety';
import { COLORS, SPACING, FONT, RADIUS } from '../theme';

// ── Safety level palette ──────────────────────────────────────────────────────

const LEVEL_COLOR: Record<number, string> = {
  1: '#3fb950', // green
  2: '#d29922', // yellow/amber
  3: '#f0883e', // orange
  4: '#f85149', // red
};

const LEVEL_FILL_ALPHA = 'aa'; // semi-transparent fill

const LEVEL_LABEL: Record<number, string> = {
  1: 'Level 1 — Normal precautions',
  2: 'Level 2 — Increased caution',
  3: 'Level 3 — Avoid non-essential travel',
  4: 'Level 4 — Avoid all travel',
};

const LEVEL_SHORT: Record<number, string> = {
  1: 'Normal precautions',
  2: 'Increased caution',
  3: 'Avoid non-essential travel',
  4: 'Avoid all travel',
};

const UNKNOWN_COLOR = '#484f58';
const UNKNOWN_FILL = UNKNOWN_COLOR + LEVEL_FILL_ALPHA;
const STROKE_COLOR = '#30363d';

function levelColor(level: SafetyLevel): string {
  if (!level) return UNKNOWN_FILL;
  return (LEVEL_COLOR[level] ?? UNKNOWN_COLOR) + LEVEL_FILL_ALPHA;
}

// ── World initial region ──────────────────────────────────────────────────────

// latitudeDelta: 140 + latitude: 20 → top edge = 90° (North Pole) → IllegalStateException
// on Android Google Maps. Keep top edge well below 85° (Maps' hard clip latitude).
const WORLD_REGION = {
  latitude: 10,
  longitude: 10,
  latitudeDelta: 140,
  longitudeDelta: 340,
};

// ── Memoized polygon component ────────────────────────────────────────────────

interface CountryPolygonProps {
  feature: CountryFeature;
  fillColor: string;
  onPress: (feature: CountryFeature) => void;
}

const CountryPolygon = memo(function CountryPolygon({
  feature,
  fillColor,
  onPress,
}: CountryPolygonProps) {
  const handlePress = useCallback(() => onPress(feature), [feature, onPress]);

  return (
    <>
      {feature.rings.map((ring, i) => (
        <Polygon
          key={`${feature.id}-${i}`}
          coordinates={ring}
          fillColor={fillColor}
          strokeColor={STROKE_COLOR}
          strokeWidth={0.5}
          tappable
          onPress={handlePress}
        />
      ))}
    </>
  );
});

// ── Legend row ────────────────────────────────────────────────────────────────

function LegendRow({
  level,
  color,
  label,
}: {
  level: number | 'unknown';
  color: string;
  label: string;
}) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendChip, { backgroundColor: color }]}>
        <Text style={styles.legendChipText}>
          {level === 'unknown' ? '?' : level}
        </Text>
      </View>
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function SafetyMapScreen() {
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [advisoryMap, setAdvisoryMap] = useState<Map<string, CountrySafety>>(new Map());
  const [lastUpdated, setLastUpdated] = useState('');
  const [sourceStatus, setSourceStatus] = useState<'ok' | 'delayed' | 'error'>('ok');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<CountryFeature | null>(null);
  const [selectedAdvisory, setSelectedAdvisory] = useState<CountrySafety | null>(null);

  const [showUnknown, setShowUnknown] = useState(true);
  const [legendExpanded, setLegendExpanded] = useState(true);

  // ── Load data on mount ──────────────────────────────────────────────────────

  const loadData = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const { levels, features: geo } = await refreshAll(force);

      setFeatures(geo);
      const m = new Map(levels.data.map((c) => [c.iso2.toUpperCase(), c]));
      setAdvisoryMap(m);

      const ts = new Date(levels.last_updated_utc);
      const hhmm = ts.toUTCString().slice(17, 22); // "HH:MM"
      setLastUpdated(`${hhmm} UTC`);
      setSourceStatus(levels.status);

      if (geo.length === 0) {
        setError('Map data unavailable. Ensure the server is running.');
      }
    } catch {
      setError('Could not load data. Check server connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Pre-compute fill colors ─────────────────────────────────────────────────

  const fillColors = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of features) {
      if (!f.iso2) {
        m.set(String(f.id), UNKNOWN_FILL);
        continue;
      }
      const advisory = advisoryMap.get(f.iso2);
      m.set(String(f.id), levelColor(advisory?.level ?? null));
    }
    return m;
  }, [features, advisoryMap]);

  // ── Visible features (filter unknown) ──────────────────────────────────────

  const visibleFeatures = useMemo(() => {
    if (showUnknown) return features;
    return features.filter((f) => advisoryMap.has(f.iso2));
  }, [features, advisoryMap, showUnknown]);

  // ── Country tap handler ─────────────────────────────────────────────────────

  const handleCountryPress = useCallback(
    (feature: CountryFeature) => {
      setSelected(feature);
      const advisory = feature.iso2 ? advisoryMap.get(feature.iso2) ?? null : null;
      setSelectedAdvisory(advisory);
    },
    [advisoryMap],
  );

  const dismissCard = useCallback(() => {
    setSelected(null);
    setSelectedAdvisory(null);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  const statusDotColor =
    sourceStatus === 'ok'
      ? COLORS.severityLow
      : sourceStatus === 'delayed'
      ? COLORS.severityMedium
      : COLORS.severityHigh;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Global Safety by Country</Text>
          <Text style={styles.headerSub}>Derived from official travel advisories</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => loadData(true)}
          accessibilityLabel="Refresh data"
        >
          <Text style={styles.refreshBtnText}>↺</Text>
        </TouchableOpacity>
      </View>

      {/* Status badge */}
      <View style={styles.statusBar}>
        <View style={[styles.dot, { backgroundColor: statusDotColor }]} />
        <Text style={styles.statusText}>
          {sourceStatus === 'ok'
            ? 'Source OK'
            : sourceStatus === 'delayed'
            ? 'Source Delayed'
            : 'Source Error'}{' '}
          · Last updated: {lastUpdated || '—'}
        </Text>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={COLORS.accent} size="large" />
            <Text style={styles.loadingText}>Loading map data…</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadData(true)}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <MapView
            style={styles.mapView}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
            initialRegion={WORLD_REGION}
            mapType="standard"
            userInterfaceStyle="dark"
            showsUserLocation={false}
            scrollEnabled
            zoomEnabled
            rotateEnabled={false}
          >
            {visibleFeatures.map((f) => (
              <CountryPolygon
                key={f.id}
                feature={f}
                fillColor={fillColors.get(String(f.id)) ?? UNKNOWN_FILL}
                onPress={handleCountryPress}
              />
            ))}
          </MapView>
        )}

        {/* Show/hide unknown toggle overlay */}
        <View style={styles.filterOverlay}>
          <Text style={styles.filterLabel}>Show no-data</Text>
          <Switch
            value={showUnknown}
            onValueChange={setShowUnknown}
            trackColor={{ false: COLORS.border, true: COLORS.accentSubtle }}
            thumbColor={showUnknown ? COLORS.accent : COLORS.textMuted}
            style={styles.filterSwitch}
          />
        </View>
      </View>

      {/* Bottom area: legend + country card */}
      <View style={styles.bottomArea}>
        {/* Legend */}
        <View style={styles.legendContainer}>
          <TouchableOpacity
            style={styles.legendHeader}
            onPress={() => setLegendExpanded((e) => !e)}
            accessibilityLabel={legendExpanded ? 'Collapse legend' : 'Expand legend'}
          >
            <Text style={styles.legendTitle}>Advisory Levels</Text>
            <Text style={styles.legendChevron}>{legendExpanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {legendExpanded && (
            <View style={styles.legendBody}>
              {([1, 2, 3, 4] as const).map((lvl) => (
                <LegendRow
                  key={lvl}
                  level={lvl}
                  color={LEVEL_COLOR[lvl]}
                  label={LEVEL_LABEL[lvl]}
                />
              ))}
              <LegendRow level="unknown" color={UNKNOWN_COLOR} label="No data available" />
            </View>
          )}
        </View>

        {/* Country detail card */}
        {selected && (
          <ScrollView style={styles.cardScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              {/* Card header */}
              <View style={styles.cardHeader}>
                {selectedAdvisory ? (
                  <View
                    style={[
                      styles.levelPill,
                      { backgroundColor: (LEVEL_COLOR[selectedAdvisory.level ?? 0] ?? UNKNOWN_COLOR) + '33' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.levelPillText,
                        { color: LEVEL_COLOR[selectedAdvisory.level ?? 0] ?? UNKNOWN_COLOR },
                      ]}
                    >
                      {selectedAdvisory.level
                        ? `Level ${selectedAdvisory.level}`
                        : 'No data'}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.levelPill, { backgroundColor: UNKNOWN_COLOR + '33' }]}>
                    <Text style={[styles.levelPillText, { color: UNKNOWN_COLOR }]}>
                      No data
                    </Text>
                  </View>
                )}
                <TouchableOpacity onPress={dismissCard} accessibilityLabel="Close country card">
                  <Text style={styles.dismissText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Country name */}
              <Text style={styles.cardCountry}>
                {selectedAdvisory?.country ?? selected.name}
              </Text>

              {/* Level label */}
              {selectedAdvisory?.level && (
                <Text style={styles.cardLevel}>
                  {LEVEL_SHORT[selectedAdvisory.level]}
                </Text>
              )}

              {/* Summary */}
              {selectedAdvisory?.summary && (
                <Text style={styles.cardSummary}>{selectedAdvisory.summary}</Text>
              )}

              {!selectedAdvisory && (
                <Text style={styles.cardNoData}>
                  No advisory data available for this country from current source.
                </Text>
              )}

              {/* Source row */}
              {selectedAdvisory && (
                <View style={styles.cardMeta}>
                  <Text style={styles.cardMetaLabel}>Source</Text>
                  <Text style={styles.cardMetaValue}>{selectedAdvisory.source}</Text>
                </View>
              )}
              {selectedAdvisory?.updated_at && (
                <View style={styles.cardMeta}>
                  <Text style={styles.cardMetaLabel}>Advisory date</Text>
                  <Text style={styles.cardMetaValue}>
                    {new Date(selectedAdvisory.updated_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              )}

              <Text style={styles.disclaimer}>
                Informational only; does not replace official guidance.
              </Text>
            </View>
          </ScrollView>
        )}

        {!selected && !loading && !error && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Tap a country for advisory details</Text>
          </View>
        )}
      </View>

      {/* Footer disclaimer */}
      <View style={styles.footerDisclaimer}>
        <Text style={styles.footerText}>
          Data is informational and does not replace official safety guidance.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT.sizeLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  refreshBtn: {
    padding: SPACING.sm,
  },
  refreshBtnText: {
    fontSize: FONT.sizeLg,
    color: COLORS.accent,
  },

  // Status bar
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
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

  // Map
  mapContainer: {
    flex: 0.45,
    overflow: 'hidden',
    position: 'relative',
  },
  mapView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT.sizeSm,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: FONT.sizeSm,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.accentSubtle,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  retryBtnText: {
    color: COLORS.accent,
    fontSize: FONT.sizeSm,
    fontWeight: '600',
  },

  // Filter overlay
  filterOverlay: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.mapOverlay,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  filterLabel: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
  },
  filterSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },

  // Bottom area
  bottomArea: {
    flex: 0.55,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  // Legend
  legendContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  legendTitle: {
    fontSize: FONT.sizeSm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legendChevron: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  legendBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minWidth: '45%',
  },
  legendChip: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  legendLabel: {
    fontSize: FONT.sizeSm - 1,
    color: COLORS.textSecondary,
    flex: 1,
  },

  // Country card
  cardScroll: {
    flex: 1,
  },
  card: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  levelPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  levelPillText: {
    fontSize: FONT.sizeSm,
    fontWeight: '600',
  },
  dismissText: {
    fontSize: FONT.sizeLg,
    color: COLORS.textMuted,
    padding: SPACING.xs,
  },
  cardCountry: {
    fontSize: FONT.sizeLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardLevel: {
    fontSize: FONT.sizeMd,
    color: COLORS.textSecondary,
  },
  cardSummary: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
  cardNoData: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  cardMetaLabel: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
    width: 90,
  },
  cardMetaValue: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  disclaimer: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },

  // Hint
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

  // Footer disclaimer
  footerDisclaimer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: FONT.sizeSm - 1,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
