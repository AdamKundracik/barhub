import { create } from 'zustand/react';
import { PlaceDetail } from '../types/types';

export interface PlaceState {
  placeName: string | null;
  placeId: string | null;
  placeDetail: PlaceDetail | null;
  setPlaceName: (placeName: string | null) => void;
  setPlaceId: (placeId: string | null) => void;
  setPlaceDetail: (placeDetail: PlaceDetail | null) => void;
}

export const usePlaceStore = create<PlaceState>()(set => ({
  placeName: null,
  placeId: null,
  placeDetail: null,
  setPlaceName: (placeName: string | null) => set({ placeName }),
  setPlaceId: (placeId: string | null) => set({ placeId }),
  setPlaceDetail: (placeDetail: PlaceDetail | null) =>
    set({ placeDetail: placeDetail }),
}));
