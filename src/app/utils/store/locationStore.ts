import { LocationType } from '../types/types';
import { create } from 'zustand';

interface LocationStore {
  useFakeLocation: boolean;
  fakeLocation: LocationType | null;
  fakeLocationName: string;
  realLocation: LocationType;
  setUseFakeLocation: (val: boolean) => void;
  setFakeLocation: (loc: LocationType, name: string) => void;
  setRealLocation: (loc: LocationType) => void;
}

export const useLocationStore = create<LocationStore>((set, get) => ({
  useFakeLocation: false,
  fakeLocation: null,
  fakeLocationName: '',
  realLocation: { latitude: 0, longitude: 0 },
  setUseFakeLocation: (val: boolean) => {
    set({ useFakeLocation: val });
  },
  setFakeLocation: (location: LocationType, name: string) => {
    set({ fakeLocation: location, fakeLocationName: name });
  },
  setRealLocation: (loc: LocationType) => set({ realLocation: loc }),
}));
