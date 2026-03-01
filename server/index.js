/**
 * Stay Safe — API Server Stub
 * Framework: Fastify
 *
 * All endpoints currently return mock JSON.
 * Replace mock handlers with real data sources as described in CLAUDE.md.
 *
 * Future: Add PostgreSQL + PostGIS for hotspot storage and border-distance queries.
 */

import Fastify from 'fastify';
import { healthRoutes } from './routes/health.js';
import { hotspotsRoutes } from './routes/hotspots.js';
import { eventsRoutes } from './routes/events.js';
import { distanceRoutes } from './routes/distance.js';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
});

// CORS headers (permissive for dev; tighten in production)
fastify.addHook('onSend', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
});

fastify.options('*', async (request, reply) => {
  reply.status(204).send();
});

// Register route modules
await fastify.register(healthRoutes, { prefix: '/api' });
await fastify.register(hotspotsRoutes, { prefix: '/api' });
await fastify.register(eventsRoutes, { prefix: '/api' });
await fastify.register(distanceRoutes, { prefix: '/api' });

// Root
fastify.get('/', async () => ({
  service: 'stay-safe-api',
  version: '1.0.0',
  status: 'stub',
  docs: 'See /api/health for source status.',
}));

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`\nStay Safe API stub running on http://localhost:${PORT}\n`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
