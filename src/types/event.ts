export type Severity = 'low' | 'medium' | 'high';
export type EventType =
  | 'armed_conflict'
  | 'civil_unrest'
  | 'air_strike'
  | 'explosion'
  | 'other';

export interface Hotspot {
  id: string;
  lat: number;
  lon: number;
  country: string;
  country_name: string;
  event_count: number;
  severity: Severity;
  fatalities: number;
  type: EventType;
  label: string;
  last_event: string; // ISO timestamp
  source: string;
  distance_km?: number; // populated client-side
}

export interface EventDetail {
  id: string;
  hotspot_id: string;
  event_time: string;
  type: EventType;
  description: string;
  fatalities: number;
  source: string;
}

export interface HotspotsDataset {
  version: string;
  generated: string;
  source: string;
  hotspots: Hotspot[];
  events?: EventDetail[];
}

export interface SourceStatus {
  name: string;
  status: 'ok' | 'delayed' | 'error';
  last_sync: string;
}
