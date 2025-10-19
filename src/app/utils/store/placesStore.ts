import { create } from 'zustand/react';
import { PlaceDetail } from '../types/types';

export interface PlaceState {
  placeName: string | null;
  placeId: string | null;
  placeAddress: string | null;
  placeDetail: PlaceDetail | null;
  setPlaceName: (placeName: string | null) => void;
  setPlaceId: (placeId: string | null) => void;
  setPlaceAddress: (placeAddress: string | null) => void;
  setPlaceDetail: (placeDetail: PlaceDetail | null) => void;
}

export const usePlaceStore = create<PlaceState>()(set => ({
  placeName: null,
  placeId: null,
  placeAddress: null,
  placeDetail: null,
  setPlaceName: (placeName: string | null) => set({ placeName }),
  setPlaceId: (placeId: string | null) => set({ placeId }),
  setPlaceAddress: (placeAddress: string | null) => set({ placeAddress }),
  setPlaceDetail: (placeDetail: PlaceDetail | null) =>
    set({ placeDetail: placeDetail }),
}));
