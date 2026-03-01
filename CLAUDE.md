# CLAUDE.md

# Stay Safe App

## Vision

This application provides a clear, neutral, and accurate global overview of conflict-related events and geographic distances.

The user should feel:
- informed, not alarmed
- oriented, not overwhelmed
- aware of proximity and global context
- safe and in control

The app must prioritize:
1. Accuracy
2. Clarity
3. Relevance
4. Safety framing
5. Privacy

No accounts. No personal data storage. No dramatization.

---

# Core Features

## 1. Around Me (Local Context)

Displays:

- User location (not stored server-side)
- Conflict hotspots within selected radius
- Distance to nearest hotspot
- Top nearest events list

Default filters:
- Time window: 7 days
- Structured sources only
- Hotspot clustering enabled

UI must show:
- “Nearest incident: X km”
- “Last updated: HH:MM UTC”
- Source status (OK / Delayed)

Language must remain neutral (use “incident”, “event”, not alarmist terminology).

---

## 2. World Overview

Displays:

- Global conflict hotspots
- Adjustable density (Top 25 / 50 / 100)
- Tap to inspect cluster
- Drill down to event list

No map clutter.
Default = aggregated clusters.

---

## 3. Distance Mode (Two Points)

User selects:

- Country A
- Capital of Country A
- Country B
- Capital of Country B

No manual coordinate input.
No free text.
Selection via searchable country picker modal.

Distance calculation:
- Geodesic (great-circle, Haversine)

Output:
- “Capital A ↔ Capital B: X km”
- Line drawn on map
- Label on line midpoint

If country-to-country mode selected:
- “Closest borders” computed server-side using PostGIS geography
- Must return exact minimal geodesic distance

---

## 4. Three Points Mode

Example: Dubai – Tehran – Tel Aviv / Jerusalem

Displays:
- Three markers
- Three lines
- Distance labels
- Optional radius rings (1000 / 2000 km)

UI must clarify:
Geometrically a point may not lie on the direct shortest line, but may still be regionally relevant.

No geopolitical claims.
Only geometric and logistical context.

---

# Accuracy Rules

1. All distances must be geodesic (great-circle).
2. Country-to-country distances must use PostGIS geography.
3. All coordinates must be verified and stored in dataset.
4. Distances displayed rounded for UI, but full precision retained internally.

Reference Earth radius:
6371.0088 km

---

# Data Sources Strategy

Structured primary sources:
- Verified conflict event databases
- Timestamped structured datasets

Optional signal layer:
- News-derived feed (must be clearly marked “signal”)

Never mix signal and structured data without labeling.

Each event must store:
- Source
- Original event timestamp
- Ingestion timestamp
- Country
- Event type
- Fatalities (if available)
- Coordinates

---

# Data Update Pipeline

Server responsibilities:

1. Maintain last_sync timestamp per source
2. Fetch incremental updates
3. Normalize event schema
4. Deduplicate events:
   - Similar time window
   - Close coordinates
   - Similar description
5. Upsert into database
6. Recalculate hotspots
7. Cache responses (stale-while-revalidate)
8. Monitor ingestion health

If source delayed:
- UI must show status indicator
- Never silently fail

---

# Hotspot Logic

Hotspot score must consider:

- Freshness
- Event count
- Severity (fatalities)
- Proximity (in Around Me mode)
- Source confidence

Only top N hotspots displayed to prevent clutter.

---

# Privacy & Safety

- No accounts
- No user tracking
- Location never permanently stored
- Logs anonymized (rounded coordinates if logged)
- No behavioral analytics tied to identity

App must clearly state:
“Data is informational and does not replace official safety guidance.”

No alarmist UI.
No flashing red.
No siren effects.

---

# Offline Dataset

Local JSON file:

countries_capitals.json

Contains:
- ISO code
- Country name
- Capital(s)
- Coordinates
- Optional notes

Must support:
- Multiple capital options if necessary
- Clear labeling for special cases

Dataset versioned with app releases.

---

# Technical Stack

Mobile:
- Expo React Native
- react-native-maps (initial)
- Upgrade path: MapLibre / Mapbox

Backend:
- Node (Fastify or Express) OR FastAPI
- PostgreSQL + PostGIS
- Optional Redis cache

Distance:
- Client-side Haversine
- Server-side ST_Distance (geography)

---

# API Endpoints

GET /api/health  
Returns source sync status.

GET /api/hotspots  
Parameters:
lat, lon, radius_km, days, types, limit  
Returns clustered hotspots with distance_km.

GET /api/events?hotspot_id=...  
Returns detailed events.

GET /api/distance?mode=capitals&from=IR&to=IL  
Returns capital-to-capital distance.

GET /api/distance?mode=borders&from=IR&to=IL  
Returns closest border-to-border distance and points.

---

# UI Clarity Requirements

Map must always:
- Auto-fit markers
- Show distance labels clearly
- Avoid overlapping clutter
- Use consistent color coding

Primary number always visible:
- Nearest incident
- Selected distance

Secondary details collapsible.

---

# Design Philosophy

The app must feel like:
- A calm control panel
- A global situational overview
- A geographic clarity tool

Not:
- A breaking news feed
- A panic dashboard
- A political statement

Neutral. Geometric. Informational.

---

# Future Extensions (Optional)

- Airspace overlays (if reliable source available)
- Maritime route overlays
- Risk heatmap slider
- Export static map snapshot
- Historical timeline playback

Core must remain simple and clear.

---

# Non-Negotiables

- No exaggerated language.
- No unverified claims.
- No storing personal data.
- No misleading proximity indicators.
- No mixing structured and news-derived data without clear labels.

Accuracy > speed.
Clarity > density.
Calmness > drama.