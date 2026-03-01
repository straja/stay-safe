# Stay Safe — API Server

Minimal Fastify stub implementing the API surface described in `CLAUDE.md`.
All endpoints currently return **mock JSON**. No real data sources are connected.

---

## Running

```bash
cd server
npm install
npm start          # production
npm run dev        # auto-restart on file change (Node 20+)
```

Server starts on `http://localhost:3001`.

---

## Endpoints

### `GET /api/health`
Returns source sync status for all ingestion pipelines.

```json
{
  "status": "ok",
  "timestamp": "...",
  "sources": [
    { "name": "structured_db_primary", "status": "ok", "last_sync": "...", "records_today": 47 }
  ]
}
```

---

### `GET /api/hotspots`
Returns clustered conflict hotspots.

| Param | Type | Default | Description |
|---|---|---|---|
| `lat` | number | — | User latitude (optional) |
| `lon` | number | — | User longitude (optional) |
| `radius_km` | number | 1000 | Filter radius in km |
| `days` | number | 7 | Time window in days |
| `types` | string | — | Comma-separated event types |
| `limit` | number | 25 | Max results |

---

### `GET /api/events?hotspot_id=<id>`
Returns individual events within a hotspot cluster.

---

### `GET /api/distance?mode=capitals&from=IR&to=IL`
Returns geodesic distance between capitals.

```json
{
  "mode": "capitals",
  "from": { "iso": "IR", "capital": "Tehran", "lat": 35.6892, "lon": 51.389 },
  "to":   { "iso": "IL", "capital": "Jerusalem", "lat": 31.7683, "lon": 35.2137 },
  "distance_km": 1223.4,
  "method": "haversine",
  "earth_radius_km": 6371.0088
}
```

### `GET /api/distance?mode=borders&from=IR&to=IL`
Returns **501 Not Implemented** — requires PostGIS.

---

## PostGIS Plan (borders mode)

When PostgreSQL + PostGIS is available:

1. Store country border polygons in a `country_borders` table with a `geography` column.
2. Query minimum geodesic distance using `ST_Distance`:

```sql
SELECT
  ST_Distance(
    (SELECT geom FROM country_borders WHERE iso = $1),
    (SELECT geom FROM country_borders WHERE iso = $2)
  ) / 1000.0 AS distance_km,
  ST_AsGeoJSON(ST_ClosestPoint(
    (SELECT geom::geometry FROM country_borders WHERE iso = $1),
    (SELECT geom::geometry FROM country_borders WHERE iso = $2)
  )) AS point_on_a,
  ST_AsGeoJSON(ST_ClosestPoint(
    (SELECT geom::geometry FROM country_borders WHERE iso = $2),
    (SELECT geom::geometry FROM country_borders WHERE iso = $1)
  )) AS point_on_b;
```

> **Important**: Use `geography` type (not `geometry`) for `ST_Distance` to get geodesic km results automatically. 1 degree ≠ constant km — only `geography` handles this correctly.

### Data ingestion pipeline (future)

```
Structured source → normalize schema → deduplicate → upsert events
                                                   ↓
                                          recalculate hotspot scores
                                                   ↓
                                          update last_sync timestamp
                                                   ↓
                                          invalidate Redis cache
```

Each event stores: `source`, `event_time`, `ingested_at`, `country`, `type`, `fatalities`, `lat`, `lon`.

Deduplication: within 30 min time window + 10 km radius + similar description hash.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | 3001 | Server port |
| `HOST` | 0.0.0.0 | Bind host |
| `DATABASE_URL` | — | PostgreSQL connection string (future) |
| `REDIS_URL` | — | Redis URL for caching (future) |
