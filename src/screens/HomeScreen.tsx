import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { MapScreenLayout } from '../components/MapScreenLayout';
import { HotspotRow } from '../components/HotspotRow';
import { getHotspots, getHotspotsMetadata } from '../data/loader';
import { haversineKm, roundCoordForLog } from '../utils/haversine';
import { formatKm, formatTimeUTC, severityLabel } from '../utils/format';
import type { Hotspot } from '../types/event';
import { COLORS, SPACING, FONT, RADIUS } from '../theme';

const RADIUS_OPTIONS = [500, 1000, 2000] as const;
type RadiusKm = (typeof RADIUS_OPTIONS)[number];

const SEVERITY_COLOR: Record<string, string> = {
  high: COLORS.severityHigh,
  medium: COLORS.severityMedium,
  low: COLORS.severityLow,
};

export function HomeScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [radius, setRadius] = useState<RadiusKm>(1000);
  const [nearbyHotspots, setNearbyHotspots] = useState<Hotspot[]>([]);
  const [allHotspots] = useState<Hotspot[]>(getHotspots());
  const [lastUpdated, setLastUpdated] = useState('');
  const [sourceStatus, setSourceStatus] = useState<'ok' | 'delayed'>('ok');

  // Load metadata
  useEffect(() => {
    const meta = getHotspotsMetadata();
    setLastUpdated(formatTimeUTC(meta.generated));
  }, []);

  // Request location
  const requestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPermissionStatus('denied');
      Alert.alert(
        'Location access',
        'Location permission was not granted. You can still use World view and Distance tools.',
        [{ text: 'OK' }]
      );
      return;
    }
    setPermissionStatus('granted');
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      // Privacy: do not store raw coords; round for any logging
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      // Logging would use roundCoordForLog(lat), roundCoordForLog(lon)
      void roundCoordForLog; // referenced to avoid lint warning
      setLocation({ lat, lon });
    } catch {
      Alert.alert('Location error', 'Could not determine your location.');
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Calculate nearby hotspots whenever location or radius changes
  useEffect(() => {
    if (!location) {
      setNearbyHotspots([]);
      return;
    }
    const scored = allHotspots
      .map((h) => ({
        ...h,
        distance_km: haversineKm(location, { lat: h.lat, lon: h.lon }),
      }))
      .filter((h) => h.distance_km <= radius)
      .sort((a, b) => a.distance_km - b.distance_km);
    setNearbyHotspots(scored);
  }, [location, radius, allHotspots]);

  // Fit map to location + nearby hotspots
  useEffect(() => {
    if (!location || !mapRef.current) return;
    const coords = [
      { latitude: location.lat, longitude: location.lon },
      ...nearbyHotspots.slice(0, 8).map((h) => ({
        latitude: h.lat,
        longitude: h.lon,
      })),
    ];
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 60, right: 40, bottom: 40, left: 40 },
      animated: true,
    });
  }, [location, nearbyHotspots]);

  const nearestKm = nearbyHotspots[0]?.distance_km;

  const initialRegion = location
    ? {
        latitude: location.lat,
        longitude: location.lon,
        latitudeDelta: radius === 500 ? 8 : radius === 1000 ? 15 : 30,
        longitudeDelta: radius === 500 ? 8 : radius === 1000 ? 15 : 30,
      }
    : {
        latitude: 25,
        longitude: 45,
        latitudeDelta: 40,
        longitudeDelta: 50,
      };

  const map = (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFillObject}
      provider={PROVIDER_DEFAULT}
      initialRegion={initialRegion}
      mapType="standard"
      showsUserLocation={permissionStatus === 'granted'}
      showsMyLocationButton={false}
      userInterfaceStyle="dark"
    >
      {/* Radius circle */}
      {location && (
        <Circle
          center={{ latitude: location.lat, longitude: location.lon }}
          radius={radius * 1000}
          strokeColor={COLORS.accent}
          strokeWidth={1}
          fillColor="rgba(88, 166, 255, 0.06)"
        />
      )}

      {/* Hotspot markers */}
      {allHotspots.map((h) => (
        <Marker
          key={h.id}
          coordinate={{ latitude: h.lat, longitude: h.lon }}
          title={h.label}
          description={`${severityLabel(h.severity)} · ${h.event_count} events`}
          pinColor={SEVERITY_COLOR[h.severity] ?? COLORS.textMuted}
        />
      ))}
    </MapView>
  );

  return (
    <MapScreenLayout map={map} mapFraction={0.5} showDisclaimer>
      {/* App header with logo */}
      <View style={styles.logoRow}>
        <Image
          source={require('../../assets/WorldAlertLogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoTitle}>World Alert</Text>
      </View>

      {/* Status bar */}
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <View style={[styles.dot, { backgroundColor: sourceStatus === 'ok' ? COLORS.severityLow : COLORS.severityMedium }]} />
          <Text style={styles.statusText}>
            Source {sourceStatus === 'ok' ? 'OK' : 'Delayed'}
          </Text>
        </View>
        <Text style={styles.statusText}>Last updated: {lastUpdated}</Text>
      </View>

      {/* Primary metric */}
      <View style={styles.primaryCard}>
        {permissionStatus === 'unknown' ? (
          <ActivityIndicator color={COLORS.accent} />
        ) : permissionStatus === 'denied' ? (
          <>
            <Text style={styles.primaryLabel}>Location not available</Text>
            <TouchableOpacity onPress={requestLocation} style={styles.retryBtn}>
              <Text style={styles.retryText}>Enable location</Text>
            </TouchableOpacity>
          </>
        ) : nearestKm != null ? (
          <>
            <Text style={styles.primaryLabel}>Nearest incident</Text>
            <Text style={styles.primaryValue}>{formatKm(nearestKm)}</Text>
            <Text style={styles.primarySub}>{nearbyHotspots[0]?.label}</Text>
          </>
        ) : (
          <>
            <Text style={styles.primaryLabel}>Nearest incident</Text>
            <Text style={styles.primaryValue}>None within {formatKm(radius)}</Text>
          </>
        )}
      </View>

      {/* Radius selector */}
      <View style={styles.radiusRow}>
        <Text style={styles.sectionLabel}>Radius</Text>
        <View style={styles.radiusBtns}>
          {RADIUS_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
              onPress={() => setRadius(r)}
            >
              <Text
                style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}
              >
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Nearby list */}
      {nearbyHotspots.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>
            Within {formatKm(radius)} ({nearbyHotspots.length} area
            {nearbyHotspots.length !== 1 ? 's' : ''})
          </Text>
          {nearbyHotspots.slice(0, 5).map((h, i) => (
            <HotspotRow key={h.id} hotspot={h} rank={i + 1} />
          ))}
        </>
      )}

      {permissionStatus === 'granted' && nearbyHotspots.length === 0 && location && (
        <View style={styles.clearCard}>
          <Text style={styles.clearText}>No recorded incidents within {formatKm(radius)} of your location.</Text>
        </View>
      )}
    </MapScreenLayout>
  );
}

const styles = StyleSheet.create({
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  logoTitle: {
    fontSize: FONT.sizeLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
  },
  primaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
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
  retryBtn: {
    marginTop: SPACING.xs,
    padding: SPACING.xs,
  },
  retryText: {
    color: COLORS.accent,
    fontSize: FONT.sizeMd,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  radiusBtns: {
    flexDirection: 'row',
    marginLeft: SPACING.sm,
    gap: SPACING.xs,
  },
  radiusBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  radiusBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSubtle,
  },
  radiusBtnText: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
  },
  radiusBtnTextActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  clearCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  clearText: {
    color: COLORS.textSecondary,
    fontSize: FONT.sizeMd,
    textAlign: 'center',
  },
});
