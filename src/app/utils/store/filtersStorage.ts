// filtersStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlaceType } from '../types/types';

interface FiltersState {
  distance: number;
  selectedPlaces: PlaceType[];
  updateFilters: (filters: {
    distance: number;
    placeTypes: PlaceType[];
  }) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS = {
  distance: 1,
  selectedPlaces: ['bar'] as PlaceType[],
};

export const useFiltersStore = create<FiltersState>()(
  persist(
    set => ({
      distance: DEFAULT_FILTERS.distance,
      selectedPlaces: DEFAULT_FILTERS.selectedPlaces,
      updateFilters: filters =>
        set({
          distance: filters.distance,
          selectedPlaces: filters.placeTypes,
        }),
      resetFilters: () =>
        set({
          distance: DEFAULT_FILTERS.distance,
          selectedPlaces: DEFAULT_FILTERS.selectedPlaces,
        }),
    }),
    {
      name: 'filters-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
