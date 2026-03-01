/**
 * GET /api/hotspots
 *
 * Query params:
 *   lat        number   (optional) user latitude
 *   lon        number   (optional) user longitude
 *   radius_km  number   default 1000
 *   days       number   default 7
 *   types      string   comma-separated event types (optional)
 *   limit      number   default 25
 *
 * Returns clustered hotspots with optional distance_km.
 *
 * Future implementation:
 *   SELECT id, lat, lon, ...,
 *          ST_Distance(
 *            geography(ST_Point(lon, lat)),
 *            geography(ST_Point($user_lon, $user_lat))
 *          ) / 1000.0 AS distance_km
 *   FROM hotspots
 *   WHERE event_time >= NOW() - INTERVAL '$days days'
 *     AND ($type_filter OR type = ANY($types))
 *     AND ST_DWithin(
 *           geography(ST_Point(lon, lat)),
 *           geography(ST_Point($user_lon, $user_lat)),
 *           $radius_km * 1000
 *         )
 *   ORDER BY distance_km ASC
 *   LIMIT $limit;
 */

const MOCK_HOTSPOTS = [
  {
    id: 'hs_001',
    lat: 33.5102,
    lon: 36.2913,
    country: 'SY',
    country_name: 'Syria',
    event_count: 14,
    severity: 'high',
    fatalities: 8,
    type: 'armed_conflict',
    label: 'Damascus region',
    last_event: '2026-02-28T21:30:00Z',
    source: 'structured_db',
  },
  {
    id: 'hs_002',
    lat: 36.2,
    lon: 37.16,
    country: 'SY',
    country_name: 'Syria',
    event_count: 7,
    severity: 'medium',
    fatalities: 3,
    type: 'armed_conflict',
    label: 'Aleppo region',
    last_event: '2026-02-27T14:10:00Z',
    source: 'structured_db',
  },
  {
    id: 'hs_003',
    lat: 50.45,
    lon: 30.52,
    country: 'UA',
    country_name: 'Ukraine',
    event_count: 22,
    severity: 'high',
    fatalities: 15,
    type: 'armed_conflict',
    label: 'Kyiv region',
    last_event: '2026-02-28T18:45:00Z',
    source: 'structured_db',
  },
  {
    id: 'hs_004',
    lat: 47.9,
    lon: 37.8,
    country: 'UA',
    country_name: 'Ukraine',
    event_count: 31,
    severity: 'high',
    fatalities: 19,
    type: 'armed_conflict',
    label: 'Eastern Ukraine',
    last_event: '2026-02-28T22:15:00Z',
    source: 'structured_db',
  },
  {
    id: 'hs_005',
    lat: 15.55,
    lon: 32.53,
    country: 'SD',
    country_name: 'Sudan',
    event_count: 18,
    severity: 'high',
    fatalities: 12,
    type: 'civil_unrest',
    label: 'Khartoum area',
    last_event: '2026-02-28T10:20:00Z',
    source: 'structured_db',
  },
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0088;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function hotspotsRoutes(fastify) {
  fastify.get('/hotspots', async (request, reply) => {
    const {
      lat,
      lon,
      radius_km = 1000,
      days = 7,
      types,
      limit = 25,
    } = request.query;

    let results = MOCK_HOTSPOTS;

    // Filter by type
    if (types) {
      const typeList = types.split(',').map((t) => t.trim());
      results = results.filter((h) => typeList.includes(h.type));
    }

    // Add distance if user location provided
    if (lat != null && lon != null) {
      const userLat = parseFloat(lat);
      const userLon = parseFloat(lon);
      results = results
        .map((h) => ({
          ...h,
          distance_km: parseFloat(haversineKm(userLat, userLon, h.lat, h.lon).toFixed(2)),
        }))
        .filter((h) => h.distance_km <= parseFloat(radius_km))
        .sort((a, b) => a.distance_km - b.distance_km);
    }

    results = results.slice(0, parseInt(limit, 10));

    return {
      count: results.length,
      days: parseInt(days, 10),
      generated: new Date().toISOString(),
      source: 'mock',
      hotspots: results,
      note: 'Mock data — replace with PostGIS query when backend is live.',
    };
  });
}
