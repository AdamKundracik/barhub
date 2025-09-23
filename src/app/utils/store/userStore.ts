import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { SearchHistoryItem, User } from '@/shared';
import { auth } from '@/firebaseConfig';
import { setUser } from '@/src/app/utils/services/functions';

interface UserStore {
  authUser: typeof auth.currentUser | null;
  isAuthLoading: boolean;

  userData: User | null;
  isUserDataLoading: boolean;
  premium: boolean;

  setAuthUser: (user: typeof auth.currentUser | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setUserData: (data: Partial<User>) => void;
  setUserDataLoading: (loading: boolean) => void;
  setPremium: (premium: boolean) => void;

  currentPushToken: string | null;
  setCurrentPushToken: (token: string | null) => void;

  searchHistory: SearchHistoryItem[];
  addToSearchHistory: (item: SearchHistoryItem) => Promise<void>;
  setSearchHistory: (history: SearchHistoryItem[]) => void;
}

export const useUserStore = create<UserStore>()(
  subscribeWithSelector((set, get) => ({
    authUser: null,
    isAuthLoading: true,
    userData: null,
    allUsers: [],
    isUserDataLoading: false,
    currentPushToken: null,
    premium: false,

    searchHistory: [],

    setSearchHistory: (history: SearchHistoryItem[]) =>
      set({ searchHistory: history }),

    addToSearchHistory: async (item: SearchHistoryItem) => {
      const { searchHistory } = get();
      const filtered = searchHistory.filter(h => h.placeId !== item.placeId);
      const updatedHistory = [item, ...filtered].slice(0, 5);
      set({ searchHistory: updatedHistory });
      try {
        await setUser({ searchHistory: updatedHistory });
      } catch (err) {
        console.error('Error saving search history:', err);
      }
    },

    setAuthUser: user => set({ authUser: user }),
    setAuthLoading: loading => set({ isAuthLoading: loading }),
    setUserData: (data: User | Partial<User>) => {
      set(state => ({
        userData: { ...state.userData, ...data } as User,
      }));
    },

    setPremium: (premium: boolean) => {
      set({ premium });
    },

    setCurrentPushToken: (token: string | null) => {
      set({ currentPushToken: token });
    },

    setUserDataLoading: loading => set({ isUserDataLoading: loading }),
  }))
);
