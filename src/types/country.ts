export interface Capital {
  name: string;
  lat: number;
  lon: number;
  note: string | null;
}

export interface Country {
  iso: string;
  name: string;
  capitals: Capital[];
}

export interface CountriesDataset {
  version: string;
  countries: Country[];
}

export interface SelectedPoint {
  country: Country;
  capital: Capital;
}
