/**
 * Safety level types for the Country Safety Map feature.
 * Levels are derived from official travel advisories — not subjective judgement.
 */

/** 1–4 advisory level from official sources; null = no data available */
export type SafetyLevel = 1 | 2 | 3 | 4 | null;

export interface CountrySafety {
  /** ISO 3166-1 alpha-2 code */
  iso2: string;
  /** English country name */
  country: string;
  /** Normalized advisory level: 1=Normal, 2=Increased caution, 3=Avoid non-essential, 4=Avoid all travel */
  level: SafetyLevel;
  /** Source name, e.g. "Canada" */
  source: string;
  /** ISO timestamp of last advisory update */
  updated_at: string;
  /** Short neutral summary (max 1 sentence) */
  summary?: string;
}

export interface SafetyLevelsResponse {
  /** ISO timestamp of last successful data fetch */
  last_updated_utc: string;
  /** ok | delayed | error */
  status: 'ok' | 'delayed' | 'error';
  /** Array of country advisory records */
  data: CountrySafety[];
}

export interface SafetyHealthResponse {
  source: string;
  reachable: boolean;
  last_successful_fetch: string | null;
  error_count: number;
  next_refresh_in_s: number;
}

// ── GeoJSON types (minimal subset for polygon rendering) ───────────────────

export interface GeoPosition {
  latitude: number;
  longitude: number;
}

export interface CountryFeature {
  /** ISO numeric code (world-atlas ID) */
  id: number;
  /** ISO 3166-1 alpha-2 (from our mapping table) */
  iso2: string;
  /** Display name */
  name: string;
  /** Outer rings for all polygons (array of Polygon rings) */
  rings: GeoPosition[][];
}
