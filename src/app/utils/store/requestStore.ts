import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RequestState = {
  requestedPlaces: Record<string, number>;
  addRequest: (placeId: string) => void;
  canRequest: (placeId: string) => boolean;
  loadRequests: () => Promise<void>;
};

export const useRequestStore = create<RequestState>((set, get) => ({
  requestedPlaces: {},

  addRequest: async placeId => {
    const timestamp = Date.now();
    set(state => ({
      requestedPlaces: { ...state.requestedPlaces, [placeId]: timestamp },
    }));

    try {
      await AsyncStorage.setItem(
        'requestedPlaces',
        JSON.stringify(get().requestedPlaces)
      );
    } catch (error) {
      console.error('Failed to save request data:', error);
    }

    // Auto-remove after 3 minutes
    setTimeout(async () => {
      set(state => {
        const updatedRequests = { ...state.requestedPlaces };
        delete updatedRequests[placeId];
        return { requestedPlaces: updatedRequests };
      });

      try {
        await AsyncStorage.setItem(
          'requestedPlaces',
          JSON.stringify(get().requestedPlaces)
        );
      } catch (error) {
        console.error('Failed to update request data:', error);
      }
    }, 180000);
  },

  canRequest: placeId => {
    const lastRequestTime = get().requestedPlaces[placeId];
    return !lastRequestTime || Date.now() - lastRequestTime > 180000;
  },

  loadRequests: async () => {
    try {
      const data = await AsyncStorage.getItem('requestedPlaces');
      if (data) {
        const parsedData = JSON.parse(data);
        set({ requestedPlaces: parsedData });
      }
    } catch (error) {
      console.error('Failed to load request data:', error);
    }
  },
}));
