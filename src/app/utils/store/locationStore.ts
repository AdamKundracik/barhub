import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { LocationType } from '../types/types';
import { setUser } from '../services/functions';
import { useUserStore } from '@/src/app/utils/store/userStore';

interface LocationStore {
  location: LocationType | null;
  fakeLocation: LocationType | null;
  useFakeLocation: boolean;
  fakeLocationName: string;
  initialized: boolean;
  setLocation: (loc: LocationType) => void;
  setFakeLocation: (location: LocationType) => void;
  setUseFakeLocation: (val: boolean) => void;
  setFakeLocationName: (name: string) => void;
  setInitialized: (val: boolean) => void;
}

// ✅ Jednoduchší store
export const useLocationStore = create<LocationStore>()(
  subscribeWithSelector((set, get) => ({
    location: null,
    fakeLocation: null,
    useFakeLocation: false,
    fakeLocationName: '',
    initialized: false,

    setLocation: (loc: LocationType) => {
      set({ location: loc });
    },
    setFakeLocation: (location: LocationType) => {
      set({ fakeLocation: location });
    },
    setUseFakeLocation: (val: boolean) => {
      set({ useFakeLocation: val });
    },
    setFakeLocationName: (name: string) => {
      set({ fakeLocationName: name });
    },
    setInitialized: (val: boolean) => set({ initialized: val }),
  }))
);

// ✅ Subscribe – vždy update do DB
useLocationStore.subscribe(
  state => state.useFakeLocation,
  (newVal, prevVal) => {
    if (newVal !== prevVal) {
      useUserStore.getState().setUserData({ isUsingFakeLocation: newVal });
      setUser({ isUsingFakeLocation: newVal });
    }
  }
);

useLocationStore.subscribe(
  state => state.location,
  (newVal, prevVal) => {
    if (newVal !== prevVal && newVal) {
      setUser({
        location: newVal,
      });
    }
  }
);

useLocationStore.subscribe(
  state => state.fakeLocation,
  (newVal, prevVal) => {
    if (newVal !== prevVal && newVal) {
      setUser({
        fakeLocation: newVal,
      });
    }
  }
);

useLocationStore.subscribe(
  state => state.fakeLocationName,
  (newVal, prevVal) => {
    if (newVal !== prevVal) {
      setUser({ fakeLocationName: newVal });
    }
  }
);
