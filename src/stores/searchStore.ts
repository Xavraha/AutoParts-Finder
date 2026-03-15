import { create } from 'zustand';

interface SearchState {
  query: string;
  lat: number | null;
  lng: number | null;
  zip: string;
  radiusMiles: number;
  make: string;
  model: string;
  yearMin: string;
  yearMax: string;
  setQuery: (q: string) => void;
  setLocation: (lat: number, lng: number, zip?: string) => void;
  setZip: (zip: string) => void;
  setRadius: (r: number) => void;
  setMake: (make: string) => void;
  setModel: (model: string) => void;
  setYearMin: (y: string) => void;
  setYearMax: (y: string) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  lat: null,
  lng: null,
  zip: '',
  radiusMiles: 50,
  make: '',
  model: '',
  yearMin: '',
  yearMax: '',
  setQuery: (query) => set({ query }),
  setLocation: (lat, lng, zip) => set({ lat, lng, zip: zip ?? '' }),
  setZip: (zip) => set({ zip }),
  setRadius: (radiusMiles) => set({ radiusMiles }),
  setMake: (make) => set({ make }),
  setModel: (model) => set({ model }),
  setYearMin: (yearMin) => set({ yearMin }),
  setYearMax: (yearMax) => set({ yearMax }),
}));
