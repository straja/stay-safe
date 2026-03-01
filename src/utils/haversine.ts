/**
 * Geodesic (great-circle) distance calculation using the Haversine formula.
 * Earth radius per CLAUDE.md specification: 6371.0088 km
 */

const EARTH_RADIUS_KM = 6371.0088;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export interface LatLon {
  lat: number;
  lon: number;
}

/**
 * Returns the great-circle distance in km between two points.
 */
export function haversineKm(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLon * sinDLon;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Returns the geographic midpoint between two points.
 * Suitable for label placement on a map line.
 */
export function midpoint(a: LatLon, b: LatLon): LatLon {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLon = toRad(b.lon - a.lon);

  const Bx = Math.cos(lat2) * Math.cos(dLon);
  const By = Math.cos(lat2) * Math.sin(dLon);

  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By)
  );
  const lon3 = toRad(a.lon) + Math.atan2(By, Math.cos(lat1) + Bx);

  return {
    lat: (lat3 * 180) / Math.PI,
    lon: (lon3 * 180) / Math.PI,
  };
}

/**
 * Rounds coordinates for privacy-safe logging (2 decimal places ≈ 1.1 km precision).
 */
export function roundCoordForLog(coord: number): number {
  return Math.round(coord * 100) / 100;
}
