/**
 * GET /api/events
 *
 * Query params:
 *   hotspot_id  string  required — ID of the hotspot cluster
 *
 * Returns detailed events within the cluster.
 *
 * Future implementation:
 *   SELECT id, lat, lon, event_time, type, fatalities, description, source, country
 *   FROM events
 *   WHERE hotspot_id = $hotspot_id
 *   ORDER BY event_time DESC;
 */

const MOCK_EVENTS = {
  hs_001: [
    {
      id: 'evt_001_a',
      hotspot_id: 'hs_001',
      lat: 33.51,
      lon: 36.29,
      event_time: '2026-02-28T21:30:00Z',
      ingested_at: '2026-02-28T21:45:00Z',
      type: 'armed_conflict',
      fatalities: 4,
      country: 'SY',
      source: 'structured_db',
      description: 'Armed activity reported in the Damascus area.',
    },
    {
      id: 'evt_001_b',
      hotspot_id: 'hs_001',
      lat: 33.52,
      lon: 36.3,
      event_time: '2026-02-28T18:00:00Z',
      ingested_at: '2026-02-28T18:20:00Z',
      type: 'armed_conflict',
      fatalities: 4,
      country: 'SY',
      source: 'structured_db',
      description: 'Armed activity reported in the Damascus area.',
    },
  ],
  hs_003: [
    {
      id: 'evt_003_a',
      hotspot_id: 'hs_003',
      lat: 50.45,
      lon: 30.52,
      event_time: '2026-02-28T18:45:00Z',
      ingested_at: '2026-02-28T19:00:00Z',
      type: 'armed_conflict',
      fatalities: 5,
      country: 'UA',
      source: 'structured_db',
      description: 'Armed activity reported in the Kyiv region.',
    },
  ],
};

export async function eventsRoutes(fastify) {
  fastify.get('/events', async (request, reply) => {
    const { hotspot_id } = request.query;

    if (!hotspot_id) {
      return reply.status(400).send({ error: 'hotspot_id is required' });
    }

    const events = MOCK_EVENTS[hotspot_id] ?? [];

    return {
      hotspot_id,
      count: events.length,
      source: 'mock',
      events,
      note: 'Mock data — replace with database query when backend is live.',
    };
  });
}
