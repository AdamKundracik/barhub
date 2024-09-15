import { create } from 'zustand/react';

export interface PlaceState {
  placeName: string | null;
  placeId: string | null;
  setPlaceName: (placeName: string | null) => void;
  setPlaceId: (placeId: string | null) => void;
}

export const usePlaceStore = create<PlaceState>()(set => ({
  placeName: null,
  placeId: null,
  setPlaceName: (placeName: string | null) => set({ placeName }),
  setPlaceId: (placeId: string | null) => set({ placeId }),
}));
