import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OccupancyTypes, PlaceType } from '../types/types';

interface FiltersState {
  distance: number;
  selectedPlaces: PlaceType[];
  selectedOccupancy: OccupancyTypes[];
  updateFilters: (filters: {
    distance: number;
    placeTypes: PlaceType[];
    occupancy: OccupancyTypes[];
  }) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS = {
  distance: 1,
  selectedPlaces: ['bar'] as PlaceType[],
  selectedOccupancy: [
    'FULL',
    'ALMOST_FULL',
    'SPARSELY_OCCUPIED',
    'EMPTY',
  ] as OccupancyTypes[],
};

export const useFiltersStore = create<FiltersState>()(
  persist(
    set => ({
      distance: DEFAULT_FILTERS.distance,
      selectedPlaces: DEFAULT_FILTERS.selectedPlaces,
      selectedOccupancy: DEFAULT_FILTERS.selectedOccupancy,
      updateFilters: filters =>
        set({
          distance: filters.distance,
          selectedPlaces: filters.placeTypes,
          selectedOccupancy: filters.occupancy,
        }),
      resetFilters: () =>
        set({
          distance: DEFAULT_FILTERS.distance,
          selectedPlaces: DEFAULT_FILTERS.selectedPlaces,
          selectedOccupancy: DEFAULT_FILTERS.selectedOccupancy,
        }),
    }),
    {
      name: 'filters-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
