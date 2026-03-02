import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { MapScreenLayout } from '../components/MapScreenLayout';
import { CountryCapitalSelector } from '../components/CountryCapitalSelector';
import { DistanceCard } from '../components/DistanceCard';
import { haversineKm, midpoint } from '../utils/haversine';
import { getCountries } from '../data/loader';
import type { SelectedPoint } from '../types/country';
import { COLORS, SPACING, FONT, RADIUS } from '../theme';
import { formatKm } from '../utils/format';

// Default: UAE (Abu Dhabi), Iran (Tehran), Israel (Tel Aviv)
function makeDefault(iso: string, capitalName: string): SelectedPoint | null {
  const countries = getCountries();
  const country = countries.find((c) => c.iso === iso);
  if (!country) return null;
  const capital = country.capitals.find((cap) => cap.name === capitalName);
  if (!capital) return null;
  return { country, capital };
}

const LINE_COLORS = [COLORS.line, COLORS.lineSecondary, COLORS.lineTertiary] as const;
const RING_RADII = [1000, 2000] as const; // km

export function ThreePointsScreen() {
  const mapRef = useRef<MapView>(null);

  const defaultA = useMemo(() => makeDefault('AE', 'Abu Dhabi'), []);
  const defaultB = useMemo(() => makeDefault('IR', 'Tehran'), []);
  const defaultCTelAviv = useMemo(() => makeDefault('IL', 'Tel Aviv'), []);
  const defaultCJerusalem = useMemo(() => makeDefault('IL', 'Jerusalem'), []);

  const [pointA, setPointA] = useState<SelectedPoint | null>(defaultA);
  const [pointB, setPointB] = useState<SelectedPoint | null>(defaultB);
  const [pointC, setPointC] = useState<SelectedPoint | null>(defaultCTelAviv);
  const [useJerusalem, setUseJerusalem] = useState(false);
  const [showRings, setShowRings] = useState(true);

  // When toggle changes, update C to matching default
  useEffect(() => {
    if (pointC?.country?.iso === 'IL') {
      setPointC(useJerusalem ? defaultCJerusalem : defaultCTelAviv);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useJerusalem]);

  const distAB =
    pointA && pointB
      ? haversineKm(
          { lat: pointA.capital.lat, lon: pointA.capital.lon },
          { lat: pointB.capital.lat, lon: pointB.capital.lon }
        )
      : null;

  const distAC =
    pointA && pointC
      ? haversineKm(
          { lat: pointA.capital.lat, lon: pointA.capital.lon },
          { lat: pointC.capital.lat, lon: pointC.capital.lon }
        )
      : null;

  const distBC =
    pointB && pointC
      ? haversineKm(
          { lat: pointB.capital.lat, lon: pointB.capital.lon },
          { lat: pointC.capital.lat, lon: pointC.capital.lon }
        )
      : null;

  const midAB =
    pointA && pointB
      ? midpoint(
          { lat: pointA.capital.lat, lon: pointA.capital.lon },
          { lat: pointB.capital.lat, lon: pointB.capital.lon }
        )
      : null;

  const midAC =
    pointA && pointC
      ? midpoint(
          { lat: pointA.capital.lat, lon: pointA.capital.lon },
          { lat: pointC.capital.lat, lon: pointC.capital.lon }
        )
      : null;

  const midBC =
    pointB && pointC
      ? midpoint(
          { lat: pointB.capital.lat, lon: pointB.capital.lon },
          { lat: pointC.capital.lat, lon: pointC.capital.lon }
        )
      : null;

  // Fit map to all selected points
  useEffect(() => {
    if (!mapRef.current) return;
    const coords = [pointA, pointB, pointC]
      .filter(Boolean)
      .map((p) => ({
        latitude: p!.capital.lat,
        longitude: p!.capital.lon,
      }));
    if (coords.length < 2) return;
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 60, bottom: 60, left: 60 },
      animated: true,
    });
  }, [pointA, pointB, pointC]);

  function MidLabel({
    mid: m,
    dist,
    color,
  }: {
    mid: { lat: number; lon: number };
    dist: number;
    color: string;
  }) {
    return (
      <Marker
        coordinate={{ latitude: m.lat, longitude: m.lon }}
        anchor={{ x: 0.5, y: 0.5 }}
        flat
      >
        <View style={[styles.midLabel, { borderColor: color }]}>
          <Text style={[styles.midLabelText, { color }]}>{formatKm(dist)}</Text>
        </View>
      </Marker>
    );
  }

  const markerLabels = ['A', 'B', 'C'];
  const points = [pointA, pointB, pointC];

  const map = (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
      initialRegion={{
        latitude: 32,
        longitude: 48,
        latitudeDelta: 20,
        longitudeDelta: 30,
      }}
      userInterfaceStyle="dark"
    >
      {/* Radius rings around Point A */}
      {showRings && pointA && RING_RADII.map((r) => (
        <Circle
          key={`ring-${r}`}
          center={{ latitude: pointA.capital.lat, longitude: pointA.capital.lon }}
          radius={r * 1000}
          strokeColor={r === 1000 ? COLORS.accent + '55' : COLORS.lineSecondary + '55'}
          strokeWidth={1}
          fillColor="transparent"
        />
      ))}

      {/* Lines */}
      {pointA && pointB && (
        <Polyline
          coordinates={[
            { latitude: pointA.capital.lat, longitude: pointA.capital.lon },
            { latitude: pointB.capital.lat, longitude: pointB.capital.lon },
          ]}
          strokeColor={LINE_COLORS[0]}
          strokeWidth={2}
          lineDashPattern={[6, 4]}
        />
      )}
      {pointA && pointC && (
        <Polyline
          coordinates={[
            { latitude: pointA.capital.lat, longitude: pointA.capital.lon },
            { latitude: pointC.capital.lat, longitude: pointC.capital.lon },
          ]}
          strokeColor={LINE_COLORS[1]}
          strokeWidth={2}
          lineDashPattern={[6, 4]}
        />
      )}
      {pointB && pointC && (
        <Polyline
          coordinates={[
            { latitude: pointB.capital.lat, longitude: pointB.capital.lon },
            { latitude: pointC.capital.lat, longitude: pointC.capital.lon },
          ]}
          strokeColor={LINE_COLORS[2]}
          strokeWidth={2}
          lineDashPattern={[6, 4]}
        />
      )}

      {/* Midpoint labels */}
      {midAB && distAB != null && <MidLabel mid={midAB} dist={distAB} color={LINE_COLORS[0]} />}
      {midAC && distAC != null && <MidLabel mid={midAC} dist={distAC} color={LINE_COLORS[1]} />}
      {midBC && distBC != null && <MidLabel mid={midBC} dist={distBC} color={LINE_COLORS[2]} />}

      {/* Markers */}
      {points.map((p, i) =>
        p ? (
          <Marker
            key={`pt-${i}`}
            coordinate={{ latitude: p.capital.lat, longitude: p.capital.lon }}
            title={`${markerLabels[i]}: ${p.capital.name}`}
            description={p.country.name}
          >
            <View style={[styles.markerBubble, { backgroundColor: LINE_COLORS[i] }]}>
              <Text style={styles.markerLabel}>{markerLabels[i]}</Text>
            </View>
          </Marker>
        ) : null
      )}
    </MapView>
  );

  return (
    <MapScreenLayout map={map} mapFraction={0.5} showDisclaimer>
      {/* Toggle row */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleItem}>
          <Text style={styles.toggleLabel}>Rings (1000 / 2000 km from A)</Text>
          <Switch
            value={showRings}
            onValueChange={setShowRings}
            trackColor={{ true: COLORS.accent, false: COLORS.border }}
            thumbColor={COLORS.textPrimary}
          />
        </View>
        {pointC?.country?.iso === 'IL' && (
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Point C: Jerusalem</Text>
            <Switch
              value={useJerusalem}
              onValueChange={setUseJerusalem}
              trackColor={{ true: COLORS.accent, false: COLORS.border }}
              thumbColor={COLORS.textPrimary}
            />
          </View>
        )}
      </View>

      {/* Geometry note */}
      <View style={styles.geoNote}>
        <Text style={styles.geoNoteText}>
          A point may not lie on the direct shortest path between two others, but may still be regionally relevant. Distances are geodesic only.
        </Text>
      </View>

      {/* Selectors */}
      <CountryCapitalSelector label="Point A" value={pointA} onChange={setPointA} />
      <CountryCapitalSelector label="Point B" value={pointB} onChange={setPointB} />
      <CountryCapitalSelector label="Point C" value={pointC} onChange={setPointC} />

      {/* Distance cards */}
      {distAB != null && pointA && pointB && (
        <DistanceCard
          from={pointA.capital.name}
          to={pointB.capital.name}
          distanceKm={distAB}
          lineColor={LINE_COLORS[0]}
        />
      )}
      {distAC != null && pointA && pointC && (
        <DistanceCard
          from={pointA.capital.name}
          to={pointC.capital.name}
          distanceKm={distAC}
          lineColor={LINE_COLORS[1]}
        />
      )}
      {distBC != null && pointB && pointC && (
        <DistanceCard
          from={pointB.capital.name}
          to={pointC.capital.name}
          distanceKm={distBC}
          lineColor={LINE_COLORS[2]}
        />
      )}
    </MapScreenLayout>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  toggleRow: {
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  toggleLabel: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
  },
  geoNote: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  geoNoteText: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  midLabel: {
    backgroundColor: COLORS.mapOverlay,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  midLabelText: {
    fontSize: FONT.sizeSm,
    fontWeight: '700',
  },
  markerBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  markerLabel: {
    color: 'white',
    fontSize: FONT.sizeSm,
    fontWeight: '700',
  },
});
