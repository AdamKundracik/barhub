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
  showHighlightedPosts: boolean;
  updateFilters: (filters: {
    distance: number;
    placeTypes: PlaceType[];
    occupancy: OccupancyTypes[];
  }) => void;
  setShowHighlightedPosts: (show: boolean) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS = {
  distance: 3,
  selectedPlaces: [] as PlaceType[],
  selectedOccupancy: [] as OccupancyTypes[],
  showHighlightedPosts: true,
};

export const useFiltersStore = create<FiltersState>()(
  persist(
    set => ({
      distance: DEFAULT_FILTERS.distance,
      selectedPlaces: DEFAULT_FILTERS.selectedPlaces,
      selectedOccupancy: DEFAULT_FILTERS.selectedOccupancy,
      showHighlightedPosts: DEFAULT_FILTERS.showHighlightedPosts,
      updateFilters: filters =>
        set({
          distance: filters.distance,
          selectedPlaces: filters.placeTypes,
          selectedOccupancy: filters.occupancy,
        }),
      setShowHighlightedPosts: (show: boolean) =>
        set({
          showHighlightedPosts: show,
        }),
      resetFilters: () =>
        set({
          selectedPlaces: DEFAULT_FILTERS.selectedPlaces,
          selectedOccupancy: DEFAULT_FILTERS.selectedOccupancy,
          showHighlightedPosts: DEFAULT_FILTERS.showHighlightedPosts,
        }),
    }),
    {
      name: 'filters-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
