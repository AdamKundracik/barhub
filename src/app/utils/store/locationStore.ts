import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { LocationType } from '../types/types';
import { userService } from '../../services/userService';
import { useUserStore as useNewUserStore } from './userStore';

interface LocationStore {
  location: LocationType | null;
  fakeLocation: LocationType | null;
  useFakeLocation: boolean;
  fakeLocationName: string;
  initialized: boolean;
  isLocationLoading: boolean;
  setLocation: (loc: LocationType) => void;
  setFakeLocation: (location: LocationType) => void;
  setUseFakeLocation: (val: boolean) => void;
  setFakeLocationName: (name: string) => void;
  setInitialized: (val: boolean) => void;
  setIsLocationLoading: (val: boolean) => void;
}

// ✅ Jednoduchší store
export const useLocationStore = create<LocationStore>()(
  subscribeWithSelector(set => ({
    location: null,
    fakeLocation: null,
    useFakeLocation: false,
    fakeLocationName: '',
    initialized: false,
    isLocationLoading: false,

    setLocation: (loc: LocationType) => {
      console.log('loc', loc);
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
    setIsLocationLoading: (val: boolean) => set({ isLocationLoading: val }),
  }))
);

// ✅ Subscribe – vždy update do DB
useLocationStore.subscribe(
  state => state.useFakeLocation,
  async (newVal, prevVal) => {
    if (newVal !== prevVal) {
      // Update local store
      useNewUserStore.getState().updateUserData({ usingFakeLocation: newVal });

      // Update backend using new userService
      const newUserStore = useNewUserStore.getState();
      const userId = newUserStore.getUserId();

      if (userId) {
        try {
          await userService.updateUser(userId, { usingFakeLocation: newVal });
          console.log(
            '[LocationStore] Fake location preference updated successfully in backend'
          );
        } catch (error) {
          console.error(
            '[LocationStore] Error updating fake location preference in backend:',
            error
          );
        }
      }
    }
  }
);

useLocationStore.subscribe(
  state => state.location,
  async (newVal, prevVal) => {
    console.log('[LocationStore] Location changed, updating backend:', newVal);

    // Update new user store (for new system)
    const newUserStore = useNewUserStore.getState();
    const userId = newUserStore.getUserId();

    // if (userId) {
    //   try {
    //     // Update backend with new location API
    //     await userService.updateLocation(userId, {
    //       latitude: newVal.latitude,
    //       longitude: newVal.longitude,
    //     });
    //     // console.log(
    //     //   '[LocationStore] Location updated successfully in backend'
    //     // );
    //   } catch (error) {
    //     console.error(
    //       '[LocationStore] Error updating location in backend:',
    //       error
    //     );
    //   }
    // }
  }
);

useLocationStore.subscribe(
  state => state.fakeLocation,
  (newVal, prevVal) => {
    if (newVal !== prevVal && newVal) {
      // Fake location coordinates are stored locally only
      // The backend only tracks the usingFakeLocation boolean flag
      console.log('[LocationStore] Fake location coordinates updated locally');
    }
  }
);

useLocationStore.subscribe(
  state => state.fakeLocationName,
  (newVal, prevVal) => {
    if (newVal !== prevVal) {
      // Fake location name is stored locally only
      // The backend only tracks the usingFakeLocation boolean flag
      console.log('[LocationStore] Fake location name updated locally');
    }
  }
);
