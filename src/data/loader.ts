import countriesData from '../../assets/countries_capitals.json';
import hotspotsData from '../../assets/mock_hotspots.json';
import type { CountriesDataset, Country } from '../types/country';
import type { HotspotsDataset, Hotspot } from '../types/event';

export function getCountries(): Country[] {
  const dataset = countriesData as CountriesDataset;
  return dataset.countries.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function getHotspots(): Hotspot[] {
  const dataset = hotspotsData as HotspotsDataset;
  return dataset.hotspots;
}

export function getHotspotsMetadata(): { generated: string; source: string } {
  const dataset = hotspotsData as HotspotsDataset;
  return { generated: dataset.generated, source: dataset.source };
}
