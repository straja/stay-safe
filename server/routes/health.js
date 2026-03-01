/**
 * GET /api/health
 *
 * Returns source sync status.
 * Future: query database for actual last_sync timestamps.
 */

const MOCK_SOURCES = [
  {
    name: 'structured_db_primary',
    status: 'ok',
    last_sync: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 min ago
    records_today: 47,
  },
  {
    name: 'structured_db_secondary',
    status: 'ok',
    last_sync: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
    records_today: 23,
  },
];

export async function healthRoutes(fastify) {
  fastify.get('/health', async (request, reply) => {
    const allOk = MOCK_SOURCES.every((s) => s.status === 'ok');
    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      sources: MOCK_SOURCES,
      note: 'Mock data — no real sources connected yet.',
    };
  });
}
