/**
 * Safety Service
 *
 * Fetches country advisory levels directly from the Government of Canada public API.
 * GeoJSON country polygons are loaded from a bundled local asset (no server needed).
 * Caches both in-memory for the session lifetime.
 * Pull-to-refresh is supported by calling fetchSafetyLevels(true).
 *
 * Privacy: no user location or identity is sent in these requests.
 */

import type { CountrySafety, SafetyLevelsResponse, CountryFeature, GeoPosition } from '../types/safety';

// Public HTTPS endpoint — works on iOS and Android without a local dev server.
const CANADA_API_URL =
  'https://data.international.gc.ca/travel-voyage/index-alpha-eng.json';

const ADVISORY_STATE_TO_LEVEL: Record<number, number> = { 0: 1, 1: 2, 2: 3, 3: 4 };

const ADVISORY_LEVEL_LABELS: Record<number, string> = {
  1: 'Normal precautions',
  2: 'Increased caution',
  3: 'Avoid non-essential travel',
  4: 'Avoid all travel',
};

// ── In-memory cache ───────────────────────────────────────────────────────────

let cachedLevels: SafetyLevelsResponse | null = null;
let cachedFeatures: CountryFeature[] | null = null;
let isoLevelMap: Map<string, CountrySafety> = new Map();

// ── Advisory levels ───────────────────────────────────────────────────────────

export async function fetchSafetyLevels(forceRefresh = false): Promise<SafetyLevelsResponse> {
  if (cachedLevels && !forceRefresh) return cachedLevels;

  try {
    const res = await fetch(CANADA_API_URL, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    // Canada API format: { metadata: {...}, data: { "AF": { "country-iso": "AF", "advisory-state": 0, ... } } }
    const rawData = json.data ?? json;
    const entries: unknown[] = Array.isArray(rawData)
      ? rawData
      : typeof rawData === 'object' && rawData !== null
        ? Object.values(rawData as object)
        : [];

    const normalized: CountrySafety[] = [];
    for (const entry of entries) {
      const e = entry as Record<string, unknown>;
      const iso2 = e['country-iso'] as string | undefined;
      if (!iso2) continue;

      const rawState = Number(e['advisory-state']);
      const level = ADVISORY_STATE_TO_LEVEL[rawState] ?? null;

      const dpField = e['date-published'];
      const updatedAt =
        typeof dpField === 'string'
          ? dpField
          : typeof dpField === 'object' && dpField !== null
            ? ((dpField as Record<string, string>)['asp'] ??
               (dpField as Record<string, string>)['date'] ??
               new Date().toISOString())
            : new Date().toISOString();

      const country = (e['country-eng'] ?? e['country-name-eng'] ?? iso2) as string;
      const levelLabel = level ? (ADVISORY_LEVEL_LABELS[level] ?? 'Unknown') : 'Unknown';

      normalized.push({
        iso2: iso2.toUpperCase(),
        country,
        level: level as CountrySafety['level'],
        source: 'Canada – Global Affairs Canada',
        updated_at: updatedAt,
        summary: `Official travel advisory: ${levelLabel}.`,
      });
    }

    const data: SafetyLevelsResponse = {
      last_updated_utc: new Date().toISOString(),
      status: 'ok',
      data: normalized,
    };

    cachedLevels = data;
    isoLevelMap = new Map(normalized.map((c) => [c.iso2.toUpperCase(), c]));
    return data;
  } catch (err) {
    console.warn('[safetyService] fetchSafetyLevels error:', err);
    return cachedLevels ?? {
      last_updated_utc: new Date().toISOString(),
      status: 'error',
      data: [],
    };
  }
}

export function getLevelForIso2(iso2: string): CountrySafety | null {
  return isoLevelMap.get(iso2.toUpperCase()) ?? null;
}

// ── GeoJSON country features ──────────────────────────────────────────────────

/** Convert GeoJSON geometry rings from [lon, lat] arrays to { latitude, longitude } */
function ringToLatLng(ring: number[][]): GeoPosition[] {
  return ring.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
}

import LOCAL_GEOJSON from '../../assets/countries-geojson.json';

export async function fetchCountryFeatures(forceRefresh = false): Promise<CountryFeature[]> {
  if (cachedFeatures && !forceRefresh) return cachedFeatures;

  try {
    const geojson = LOCAL_GEOJSON as {
      features: Array<{
        id: number | string;
        properties: { iso2: string | null; name: string };
        geometry: { type: string; coordinates: unknown };
      }>;
    };

    const features: CountryFeature[] = [];

    for (const [idx, feature] of (geojson.features ?? []).entries()) {
      const geom = feature.geometry;
      const iso2: string = (feature.properties?.iso2 ?? '').toUpperCase();
      const name: string = feature.properties?.name ?? iso2;
      const rawId = feature.id;
      const id =
        rawId != null && rawId !== '' && !Number.isNaN(Number(rawId))
          ? Number(rawId)
          : -(idx + 1);

      if (!geom) continue;

      const rings: GeoPosition[][] = [];
      const coords = geom.coordinates as number[][][][];

      if (geom.type === 'Polygon') {
        if ((coords as unknown as number[][][])[0])
          rings.push(ringToLatLng((coords as unknown as number[][][])[0]));
      } else if (geom.type === 'MultiPolygon') {
        for (const poly of coords) {
          if (poly[0]) rings.push(ringToLatLng(poly[0]));
        }
      }

      if (rings.length > 0) {
        features.push({ id, iso2, name, rings });
      }
    }

    cachedFeatures = features;
    return features;
  } catch (err) {
    console.warn('[safetyService] fetchCountryFeatures error:', err);
    return cachedFeatures ?? [];
  }
}

// ── Refresh both in parallel ──────────────────────────────────────────────────

export async function refreshAll(forceRefresh = false): Promise<{
  levels: SafetyLevelsResponse;
  features: CountryFeature[];
}> {
  const [levels, features] = await Promise.all([
    fetchSafetyLevels(forceRefresh),
    fetchCountryFeatures(forceRefresh),
  ]);
  return { levels, features };
}
