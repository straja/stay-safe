import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { MapScreenLayout } from '../components/MapScreenLayout';
import { CountryCapitalSelector } from '../components/CountryCapitalSelector';
import { DistanceCard } from '../components/DistanceCard';
import { haversineKm, midpoint } from '../utils/haversine';
import type { SelectedPoint } from '../types/country';
import { COLORS, SPACING, FONT, RADIUS } from '../theme';
import { formatKm } from '../utils/format';

export function TwoPointsScreen() {
  const mapRef = useRef<MapView>(null);
  const [pointA, setPointA] = useState<SelectedPoint | null>(null);
  const [pointB, setPointB] = useState<SelectedPoint | null>(null);

  const distance =
    pointA && pointB
      ? haversineKm(
          { lat: pointA.capital.lat, lon: pointA.capital.lon },
          { lat: pointB.capital.lat, lon: pointB.capital.lon }
        )
      : null;

  const mid =
    pointA && pointB
      ? midpoint(
          { lat: pointA.capital.lat, lon: pointA.capital.lon },
          { lat: pointB.capital.lat, lon: pointB.capital.lon }
        )
      : null;

  // Fit map when both points are selected
  useEffect(() => {
    if (!pointA || !pointB || !mapRef.current) return;
    mapRef.current.fitToCoordinates(
      [
        { latitude: pointA.capital.lat, longitude: pointA.capital.lon },
        { latitude: pointB.capital.lat, longitude: pointB.capital.lon },
      ],
      { edgePadding: { top: 80, right: 60, bottom: 60, left: 60 }, animated: true }
    );
  }, [pointA, pointB]);

  const polylineCoords =
    pointA && pointB
      ? [
          { latitude: pointA.capital.lat, longitude: pointA.capital.lon },
          { latitude: pointB.capital.lat, longitude: pointB.capital.lon },
        ]
      : [];

  const map = (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFillObject}
      provider={PROVIDER_DEFAULT}
      initialRegion={{
        latitude: 30,
        longitude: 40,
        latitudeDelta: 50,
        longitudeDelta: 60,
      }}
      userInterfaceStyle="dark"
    >
      {pointA && (
        <Marker
          coordinate={{ latitude: pointA.capital.lat, longitude: pointA.capital.lon }}
          title={`A: ${pointA.capital.name}`}
          description={pointA.country.name}
          pinColor={COLORS.accent}
        />
      )}
      {pointB && (
        <Marker
          coordinate={{ latitude: pointB.capital.lat, longitude: pointB.capital.lon }}
          title={`B: ${pointB.capital.name}`}
          description={pointB.country.name}
          pinColor={COLORS.lineTertiary}
        />
      )}
      {polylineCoords.length === 2 && (
        <Polyline
          coordinates={polylineCoords}
          strokeColor={COLORS.line}
          strokeWidth={2}
          lineDashPattern={[6, 4]}
        />
      )}
      {/* Midpoint label marker */}
      {mid && distance != null && (
        <Marker
          coordinate={{ latitude: mid.lat, longitude: mid.lon }}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
        >
          <View style={styles.midLabel}>
            <Text style={styles.midLabelText}>{formatKm(distance)}</Text>
          </View>
        </Marker>
      )}
    </MapView>
  );

  return (
    <MapScreenLayout map={map} mapFraction={0.48} showDisclaimer>
      {/* Primary metric */}
      <View style={styles.primaryCard}>
        {distance != null ? (
          <>
            <Text style={styles.primaryLabel}>Great-circle distance</Text>
            <Text style={styles.primaryValue}>{formatKm(distance)}</Text>
            <Text style={styles.primarySub}>
              {pointA?.capital.name} ↔ {pointB?.capital.name}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.primaryLabel}>Select two points</Text>
            <Text style={styles.primaryValue}>— km</Text>
            <Text style={styles.primarySub}>Choose countries below</Text>
          </>
        )}
      </View>

      {/* Selectors */}
      <CountryCapitalSelector
        label="Point A"
        value={pointA}
        onChange={setPointA}
      />
      <CountryCapitalSelector
        label="Point B"
        value={pointB}
        onChange={setPointB}
      />

      {/* Distance card */}
      {distance != null && pointA && pointB && (
        <DistanceCard
          from={`${pointA.capital.name} (${pointA.country.iso})`}
          to={`${pointB.capital.name} (${pointB.country.iso})`}
          distanceKm={distance}
          note="Geodesic (great-circle) · Haversine formula · R = 6371.0088 km"
        />
      )}

      <Text style={styles.modeNote}>
        Capital-to-capital mode. For border-to-border distance, a PostGIS backend is required (see server stub).
      </Text>
    </MapScreenLayout>
  );
}

const styles = StyleSheet.create({
  primaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  primaryLabel: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
  },
  primaryValue: {
    fontSize: FONT.size2xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  primarySub: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  midLabel: {
    backgroundColor: COLORS.mapOverlay,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  midLabelText: {
    color: COLORS.accent,
    fontSize: FONT.sizeSm,
    fontWeight: '700',
  },
  modeNote: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
});
