# Stay Safe

A clear, neutral, accurate global conflict-overview and distance tool.
Built with Expo React Native (TypeScript).

> Data is informational and does not replace official safety guidance.

---

## What is implemented

| Feature | Status |
|---|---|
| Around Me screen — location + radius + hotspot list | Working (mock data) |
| World screen — global hotspot map + density control | Working (mock data) |
| Two Points distance screen — capital-to-capital | Working |
| Three Points screen — triangle + radius rings | Working |
| Searchable country/capital picker modal | Working |
| Offline countries dataset (30 countries) | Working |
| Haversine geodesic distance (R = 6371.0088 km) | Working |
| Map lines with midpoint distance labels | Working |
| Neutral language + safety disclaimer | Working |
| Privacy: location never stored | Working |
| API server stub (Fastify) | Working (mock) |

## What is mocked / not yet implemented

| Feature | Status |
|---|---|
| Real conflict data sources | Mock JSON only |
| Live data ingestion pipeline | Stub |
| PostGIS border-to-border distance | Stub (501) |
| Redis cache | Not implemented |
| Push notifications | Not implemented |
| Historical timeline | Not implemented |

---

## Distance reference checks (Haversine, R = 6371.0088 km)

Reference point: Dubai (25.2048°N, 55.2708°E)

| Route | Expected (approx) | Computed |
|---|---|---|
| Dubai → Tehran | ~1,223 km | 1,223.4 km |
| Dubai → Tel Aviv | ~2,136 km | 2,136.4 km |
| Dubai → Jerusalem | ~2,088 km | 2,087.6 km |

All match published great-circle references within < 1 km.
(Abu Dhabi as dataset default: Abu Dhabi → Tehran ≈ 1,282 km; Abu Dhabi → Tel Aviv ≈ 2,094 km.)

---

## Running the app

### Prerequisites

- Node.js 20+
- Expo CLI: `npm install -g expo-cli` (or use `npx expo`)
- iOS Simulator (Xcode) or Android Emulator, or Expo Go on device

### Install and start

```bash
# From repo root
npm install
npx expo start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan QR with Expo Go.

### Maps setup

**iOS**: Works out of the box with Apple Maps (no API key needed for development).

**Android**: Requires a Google Maps API key.
1. Get a key from [Google Cloud Console](https://console.cloud.google.com/)
2. Replace `YOUR_ANDROID_GOOGLE_MAPS_API_KEY` in `app.json`
3. Also set `YOUR_IOS_GOOGLE_MAPS_API_KEY` if you want Google Maps on iOS

---

## Running the server stub

```bash
cd server
npm install
npm start
# or: npm run dev  (auto-reload)
```

Server runs on `http://localhost:3001`.

Test:
```bash
curl http://localhost:3001/api/health
curl "http://localhost:3001/api/distance?mode=capitals&from=AE&to=IR"
curl "http://localhost:3001/api/hotspots?lat=25&lon=55&radius_km=2000"
```

---

## Project structure

```
stay-safe/
├── App.tsx                          # Root: navigation + tab bar
├── app.json                         # Expo config
├── package.json
├── tsconfig.json
├── babel.config.js
│
├── assets/
│   ├── countries_capitals.json      # Offline dataset (versioned with app)
│   └── mock_hotspots.json           # Mock conflict data
│
├── src/
│   ├── theme.ts                     # Design tokens (colors, spacing, fonts)
│   ├── types/
│   │   ├── country.ts               # Country, Capital, SelectedPoint types
│   │   └── event.ts                 # Hotspot, Severity, EventType types
│   ├── data/
│   │   └── loader.ts                # Dataset loader functions
│   ├── utils/
│   │   ├── haversine.ts             # Geodesic distance + midpoint
│   │   └── format.ts                # Display formatters (km, UTC, relative time)
│   ├── components/
│   │   ├── MapScreenLayout.tsx      # Map (top) + panel (bottom) layout
│   │   ├── PickerModal.tsx          # Searchable FlatList modal
│   │   ├── CountryCapitalSelector.tsx  # Country → Capital selector pair
│   │   ├── DistanceCard.tsx         # Distance result card
│   │   └── HotspotRow.tsx           # Hotspot list row
│   └── screens/
│       ├── HomeScreen.tsx           # Around Me
│       ├── WorldScreen.tsx          # World overview
│       ├── DistancesScreen.tsx      # Tab entry + stack navigator
│       ├── TwoPointsScreen.tsx      # Capital A ↔ Capital B
│       └── ThreePointsScreen.tsx    # Three-point triangle
│
└── server/
    ├── index.js                     # Fastify entry point
    ├── package.json
    ├── README.md                    # Server docs + PostGIS plan
    └── routes/
        ├── health.js                # GET /api/health
        ├── hotspots.js              # GET /api/hotspots
        ├── events.js                # GET /api/events
        └── distance.js              # GET /api/distance
```

---

## Extending the dataset

Edit `assets/countries_capitals.json`. Each entry:

```json
{
  "iso": "XY",
  "name": "Country Name",
  "capitals": [
    {
      "name": "Capital City",
      "lat": 0.0,
      "lon": 0.0,
      "note": null
    }
  ]
}
```

For countries with multiple capitals or contested status, add multiple entries in `capitals[]` with explanatory `note` strings.

---

## Design principles

- **Neutral language**: "incident", "event", "armed conflict" — no alarmist terms
- **Calm UI**: dark palette, no flashing, no sirens
- **Privacy**: location used only in-session, never stored, logs use rounded coords
- **Accuracy first**: all distances geodesic (Haversine), full precision retained internally
- **No accounts**: no login, no tracking, no behavioral analytics

---

## Future extensions (CLAUDE.md)

- Connect real structured conflict data sources
- PostGIS border-to-border distance endpoint
- Redis stale-while-revalidate caching
- Airspace / maritime route overlays
- Risk heatmap slider
- Historical timeline playback
- Export static map snapshot
