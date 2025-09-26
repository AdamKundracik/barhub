import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OccupancyTypes,
  PlaceType,
} from '@/src/app/utils/types/Feed/PostTypes';

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
  distance: 3,
  selectedPlaces: [
    'bar',
    'bakery',
    'bowling_alley',
    'cafe',
    'casino',
    'night_club',
    'restaurant',
    'tourist_attraction',
  ] as PlaceType[],
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
