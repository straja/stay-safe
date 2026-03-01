/**
 * GET /api/distance
 *
 * Query params:
 *   mode    'capitals' | 'borders'
 *   from    ISO country code (e.g. 'IR')
 *   to      ISO country code (e.g. 'IL')
 *   capA    capital name for country A (optional; auto-selected if only one)
 *   capB    capital name for country B (optional)
 *
 * Modes:
 *
 * capitals — geodesic distance between the two selected capitals.
 *   Client can compute this with Haversine; server version available for
 *   server-driven calculations or batch processing.
 *
 * borders — MINIMUM geodesic distance between the two countries' borders.
 *   Requires PostGIS geography type.
 *   Future SQL:
 *     SELECT
 *       ST_Distance(
 *         (SELECT geom FROM country_borders WHERE iso = $from),
 *         (SELECT geom FROM country_borders WHERE iso = $to)
 *       ) / 1000.0 AS distance_km,
 *       ST_AsGeoJSON(ST_ClosestPoint(
 *         (SELECT geom FROM country_borders WHERE iso = $from),
 *         (SELECT geom FROM country_borders WHERE iso = $to)
 *       )) AS point_on_a,
 *       ST_AsGeoJSON(ST_ClosestPoint(
 *         (SELECT geom FROM country_borders WHERE iso = $to),
 *         (SELECT geom FROM country_borders WHERE iso = $from)
 *       )) AS point_on_b
 *     ;
 *   Note: Use geography type (not geometry) for correct geodesic results.
 */

const EARTH_RADIUS_KM = 6371.0088;

const CAPITALS_DB = {
  AE: { name: 'Abu Dhabi', lat: 24.4539, lon: 54.3773 },
  IR: { name: 'Tehran', lat: 35.6892, lon: 51.389 },
  IL: { name: 'Jerusalem', lat: 31.7683, lon: 35.2137 },
  RS: { name: 'Belgrade', lat: 44.8176, lon: 20.4633 },
  US: { name: 'Washington, D.C.', lat: 38.8951, lon: -77.0364 },
  GB: { name: 'London', lat: 51.5074, lon: -0.1278 },
  FR: { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  DE: { name: 'Berlin', lat: 52.52, lon: 13.405 },
  RU: { name: 'Moscow', lat: 55.7558, lon: 37.6173 },
  CN: { name: 'Beijing', lat: 39.9042, lon: 116.4074 },
  UA: { name: 'Kyiv', lat: 50.4501, lon: 30.5234 },
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export async function distanceRoutes(fastify) {
  fastify.get('/distance', async (request, reply) => {
    const { mode = 'capitals', from, to, capA, capB } = request.query;

    if (!from || !to) {
      return reply.status(400).send({ error: '"from" and "to" ISO codes are required.' });
    }

    if (mode === 'capitals') {
      const a = CAPITALS_DB[from.toUpperCase()];
      const b = CAPITALS_DB[to.toUpperCase()];

      if (!a) return reply.status(404).send({ error: `Unknown country code: ${from}` });
      if (!b) return reply.status(404).send({ error: `Unknown country code: ${to}` });

      const distance_km = parseFloat(haversineKm(a.lat, a.lon, b.lat, b.lon).toFixed(4));

      return {
        mode: 'capitals',
        from: { iso: from.toUpperCase(), capital: a.name, lat: a.lat, lon: a.lon },
        to: { iso: to.toUpperCase(), capital: b.name, lat: b.lat, lon: b.lon },
        distance_km,
        method: 'haversine',
        earth_radius_km: EARTH_RADIUS_KM,
      };
    }

    if (mode === 'borders') {
      // PostGIS not yet available — return stub with explanation
      return reply.status(501).send({
        error: 'borders mode requires PostGIS backend',
        detail:
          'Use ST_Distance with geography type to compute minimum geodesic border-to-border distance. ' +
          'See server/routes/distance.js for the planned SQL query.',
        mode: 'borders',
        from,
        to,
        status: 'not_implemented',
      });
    }

    return reply.status(400).send({ error: `Unknown mode: ${mode}. Use 'capitals' or 'borders'.` });
  });
}
