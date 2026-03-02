/**
 * Safety Levels Routes
 *
 * GET /api/safety-levels         — normalized advisory levels per country
 * GET /api/safety-levels/health  — data source health
 * GET /api/geo/countries         — processed world GeoJSON (110m simplified)
 *
 * Data source: Government of Canada "Country Travel Advice and Advisories"
 * URL: https://data.international.gc.ca/travel-voyage/index-alpha-eng.json
 * License: Open Government Licence – Canada
 *
 * advisory-state mapping:
 *   0 → Level 1 (Normal precautions)
 *   1 → Level 2 (Increased caution)
 *   2 → Level 3 (Avoid non-essential travel)
 *   3 → Level 4 (Avoid all travel)
 */

import { createRequire } from 'module';

const _require = createRequire(import.meta.url);

// ── Constants ────────────────────────────────────────────────────────────────

const CANADA_API_URL =
  'https://data.international.gc.ca/travel-voyage/index-alpha-eng.json';

const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

const ADVISORY_LEVEL_LABELS = {
  1: 'Normal precautions',
  2: 'Increased caution',
  3: 'Avoid non-essential travel',
  4: 'Avoid all travel',
};

const ADVISORY_STATE_TO_LEVEL = { 0: 1, 1: 2, 2: 3, 3: 4 };

// ── ISO numeric → ISO2 mapping (ISO 3166-1, decimal only, no duplicates) ─────
// Maps world-atlas feature IDs to 2-letter country codes for advisory join.
const ISO_NUMERIC_TO_ISO2 = {
  4: 'AF',   8: 'AL',  12: 'DZ',  20: 'AD',  24: 'AO',  28: 'AG',
  32: 'AR',  36: 'AU',  40: 'AT',  31: 'AZ',  44: 'BS',  48: 'BH',
  50: 'BD',  52: 'BB', 112: 'BY',  56: 'BE',  84: 'BZ', 204: 'BJ',
  64: 'BT',  68: 'BO',  70: 'BA',  72: 'BW',  76: 'BR',  96: 'BN',
 100: 'BG', 854: 'BF', 108: 'BI', 132: 'CV', 116: 'KH', 120: 'CM',
 124: 'CA', 140: 'CF', 148: 'TD', 152: 'CL', 156: 'CN', 170: 'CO',
 174: 'KM', 180: 'CD', 178: 'CG', 188: 'CR', 191: 'HR', 192: 'CU',
 196: 'CY', 203: 'CZ', 208: 'DK', 262: 'DJ', 214: 'DO', 218: 'EC',
 818: 'EG', 222: 'SV', 232: 'ER', 233: 'EE', 231: 'ET', 242: 'FJ',
 246: 'FI', 250: 'FR', 266: 'GA', 270: 'GM', 268: 'GE', 276: 'DE',
 288: 'GH', 300: 'GR', 320: 'GT', 324: 'GN', 624: 'GW', 328: 'GY',
 332: 'HT', 340: 'HN', 348: 'HU', 352: 'IS', 356: 'IN', 360: 'ID',
 364: 'IR', 368: 'IQ', 372: 'IE', 376: 'IL', 380: 'IT', 388: 'JM',
 392: 'JP', 400: 'JO', 398: 'KZ', 404: 'KE', 408: 'KP', 410: 'KR',
 414: 'KW', 417: 'KG', 418: 'LA', 422: 'LB', 426: 'LS', 430: 'LR',
 434: 'LY', 440: 'LT', 442: 'LU', 450: 'MG', 454: 'MW', 458: 'MY',
 462: 'MV', 466: 'ML', 470: 'MT', 478: 'MR', 484: 'MX', 496: 'MN',
 498: 'MD', 504: 'MA', 508: 'MZ', 104: 'MM', 516: 'NA', 524: 'NP',
 528: 'NL', 554: 'NZ', 558: 'NI', 562: 'NE', 566: 'NG', 807: 'MK',
 578: 'NO', 512: 'OM', 586: 'PK', 591: 'PA', 598: 'PG', 600: 'PY',
 604: 'PE', 608: 'PH', 616: 'PL', 620: 'PT', 634: 'QA', 642: 'RO',
 643: 'RU', 646: 'RW', 682: 'SA', 686: 'SN', 688: 'RS', 694: 'SL',
 703: 'SK', 705: 'SI', 706: 'SO', 710: 'ZA', 724: 'ES', 144: 'LK',
 729: 'SD', 728: 'SS', 740: 'SR', 752: 'SE', 756: 'CH', 760: 'SY',
 762: 'TJ', 764: 'TH', 788: 'TN', 792: 'TR', 795: 'TM', 800: 'UG',
 804: 'UA', 784: 'AE', 826: 'GB', 840: 'US', 858: 'UY', 860: 'UZ',
 862: 'VE', 704: 'VN', 887: 'YE', 894: 'ZM', 716: 'ZW',
  51: 'AM', 275: 'PS', 792: 'TR', 887: 'YE', 90: 'SB', 548: 'VU',
 520: 'NR', 585: 'PW', 584: 'MH', 583: 'FM', 776: 'TO', 882: 'WS',
};

// ── In-memory state ──────────────────────────────────────────────────────────

const state = {
  /** @type {Map<string, object>} ISO2 → advisory record */
  advisories: new Map(),
  /** @type {Array<{id: number, iso2: string|null, name: string, geometry: object}>} */
  geoFeatures: [],
  /** @type {string|null} */
  lastSuccessfulFetch: null,
  /** @type {string|null} */
  lastFetchAttempt: null,
  errorCount: 0,
  /** @type {'ok'|'delayed'|'error'} */
  status: 'ok',
  /** @type {NodeJS.Timeout|null} */
  refreshTimer: null,
};

// ── GeoJSON processing ───────────────────────────────────────────────────────

function loadGeoFeatures() {
  try {
    const topology = _require('world-atlas/countries-110m.json');
    const { feature } = _require('topojson-client');
    const collection = feature(topology, topology.objects.countries);

    state.geoFeatures = collection.features.map((f) => {
      const numericId = Number(f.id);
      const iso2 = ISO_NUMERIC_TO_ISO2[numericId] ?? null;
      return {
        id: numericId,
        iso2,
        name: iso2 ?? String(numericId),
        geometry: f.geometry,
      };
    });

    console.log(`[safety] Loaded ${state.geoFeatures.length} country GeoJSON features`);
  } catch (err) {
    console.error('[safety] Failed to load GeoJSON features:', err.message);
    state.geoFeatures = [];
  }
}

// ── Canada advisory fetch ────────────────────────────────────────────────────

async function fetchCanadaAdvisories() {
  state.lastFetchAttempt = new Date().toISOString();
  try {
    const res = await fetch(CANADA_API_URL, {
      headers: { Accept: 'application/json', 'User-Agent': 'WorldAlertApp/1.0' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    // Canada API format: { metadata: {...}, data: { "AF": {...}, "AL": {...}, ... } }
    // data is a dict keyed by ISO2 code.
    const rawData = json.data ?? json;
    const entriesIterable = Array.isArray(rawData)
      ? rawData
      : typeof rawData === 'object' && rawData !== null
        ? Object.values(rawData)
        : [];

    const newMap = new Map();
    for (const entry of entriesIterable) {
      const iso2 = entry['country-iso'];
      if (!iso2) continue;
      const rawState = Number(entry['advisory-state']);
      const level = ADVISORY_STATE_TO_LEVEL[rawState] ?? null;

      // date-published may be a string OR { timestamp, date, asp }
      const dpField = entry['date-published'];
      const updatedAt =
        typeof dpField === 'string'
          ? dpField
          : typeof dpField === 'object' && dpField !== null
            ? (dpField['asp'] ?? dpField['date'] ?? new Date().toISOString())
            : new Date().toISOString();

      const engName =
        entry['country-eng'] ?? entry['country-name-eng'] ?? iso2;
      const levelLabel = ADVISORY_LEVEL_LABELS[level] ?? 'Unknown';

      newMap.set(iso2.toUpperCase(), {
        iso2: iso2.toUpperCase(),
        country: engName,
        level,
        source: 'Canada – Global Affairs Canada',
        updated_at: updatedAt,
        summary: `Official travel advisory: ${levelLabel}.`,
      });
    }

    if (newMap.size > 0) {
      state.advisories = newMap;
      state.lastSuccessfulFetch = new Date().toISOString();
      state.status = 'ok';
      state.errorCount = 0;
      console.log(`[safety] Loaded ${newMap.size} advisories from Canada API`);
    } else {
      throw new Error('Empty response from Canada API');
    }
  } catch (err) {
    state.errorCount += 1;
    state.status = state.lastSuccessfulFetch ? 'delayed' : 'error';
    console.warn('[safety] Canada API fetch failed:', err.message);
    // Retain any previously cached data
  }
}

// ── Scheduled refresh ────────────────────────────────────────────────────────

function scheduleRefresh() {
  if (state.refreshTimer) clearTimeout(state.refreshTimer);
  state.refreshTimer = setTimeout(async () => {
    await fetchCanadaAdvisories();
    scheduleRefresh();
  }, REFRESH_INTERVAL_MS);
}

// ── GeoJSON response builder ─────────────────────────────────────────────────

function buildGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: state.geoFeatures.map((f) => ({
      type: 'Feature',
      id: f.id,
      properties: { iso2: f.iso2, name: f.name },
      geometry: f.geometry,
    })),
  };
}

// ── Route registration ───────────────────────────────────────────────────────

export async function safetyLevelsRoutes(fastify) {
  // Load GeoJSON synchronously; fetch advisories async (non-blocking start)
  loadGeoFeatures();
  fetchCanadaAdvisories().then(scheduleRefresh);

  // GET /api/safety-levels
  fastify.get('/safety-levels', async (_req, reply) => {
    reply.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    const data = Array.from(state.advisories.values());
    return {
      last_updated_utc: state.lastSuccessfulFetch ?? new Date().toISOString(),
      status: state.status,
      source: 'Canada – Global Affairs Canada',
      count: data.length,
      data,
    };
  });

  // GET /api/safety-levels/health
  fastify.get('/safety-levels/health', async () => {
    const elapsed = state.lastSuccessfulFetch
      ? Date.now() - new Date(state.lastSuccessfulFetch).getTime()
      : REFRESH_INTERVAL_MS;
    return {
      source: 'Canada – Global Affairs Canada',
      url: CANADA_API_URL,
      reachable: state.status !== 'error',
      last_successful_fetch: state.lastSuccessfulFetch,
      last_fetch_attempt: state.lastFetchAttempt,
      error_count: state.errorCount,
      advisory_count: state.advisories.size,
      next_refresh_in_s: Math.max(0, Math.round((REFRESH_INTERVAL_MS - elapsed) / 1000)),
      geo_features_loaded: state.geoFeatures.length,
    };
  });

  // GET /api/geo/countries — world country polygons (110m simplified GeoJSON)
  fastify.get('/geo/countries', async (_req, reply) => {
    reply.header('Cache-Control', 'public, max-age=86400');
    if (state.geoFeatures.length === 0) {
      reply.status(503);
      return {
        error: 'GeoJSON not loaded. Ensure world-atlas and topojson-client are installed (cd server && npm install).',
      };
    }
    return buildGeoJSON();
  });
}
