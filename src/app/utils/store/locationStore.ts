import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { LocationType } from '../types/types';
import { setUser } from '../services/functions';

interface LocationStore {
  useFakeLocation: boolean;
  fakeLocation: LocationType;
  fakeLocationName: string;
  realLocation: LocationType;
  initialized: boolean;
  setUseFakeLocation: (val: boolean) => void;
  setFakeLocation: (loc: LocationType, name: string) => void;
  setRealLocation: (loc: LocationType) => void;
  setInitialized: (val: boolean) => void;
}

// ✅ Create store with subscribeWithSelector middleware
export const useLocationStore = create<LocationStore>()(
  subscribeWithSelector((set, get) => ({
    useFakeLocation: false,
    fakeLocation: { latitude: 0, longitude: 0 },
    fakeLocationName: '',
    realLocation: { latitude: 0, longitude: 0 },
    initialized: false,
    setUseFakeLocation: (val: boolean) => {
      set({ useFakeLocation: val });
    },
    setFakeLocation: (location: LocationType, name: string) => {
      set({ fakeLocation: location, fakeLocationName: name });
    },
    setRealLocation: (loc: LocationType) => set({ realLocation: loc }),
    setInitialized: (val: boolean) => set({ initialized: val }),
  }))
);

// ✅ React to useFakeLocation changes only after initialization
useLocationStore.subscribe(
  state => state.useFakeLocation,
  (newVal, prevVal) => {
    const { initialized } = useLocationStore.getState();
    if (initialized && newVal !== prevVal) {
      setUser({ isUsingFakeLocation: newVal });
    }
  }
);

useLocationStore.subscribe(
  state => state.fakeLocation,
  (newVal, prevVal) => {
    const { initialized, fakeLocationName } = useLocationStore.getState();
    if (initialized && newVal !== prevVal) {
      setUser({ fakeLocation: newVal, fakeLocationName: fakeLocationName });
    }
  }
);
