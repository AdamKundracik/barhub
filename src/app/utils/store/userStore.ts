import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { SearchHistoryItem, User } from '@/shared';
import { auth } from '@/firebaseConfig';
import { getDaysSince } from '@/src/app/utils/helper-functions/getDaysSince';
import { FirebaseTimestamp } from '@/src/app/utils/types/types';
import { userService } from '@/src/app/services/userService';
import { SearchHistoryItemEmbeddable } from '@/src/app/types/dto';

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

  canSeeContent: boolean;
  setCanSeeContent: (date: FirebaseTimestamp) => void;

  lastUploadedPost: Date | FirebaseTimestamp | null;
  setLastUploadedPost: (lastUploadedPost: Date | FirebaseTimestamp) => void;
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
    lastUploadedPost: null,

    searchHistory: [],

    canSeeContent: false,

    setCanSeeContent: date => {
      const days = getDaysSince(date);
      set({ canSeeContent: days < 7 });
    },

    setSearchHistory: (history: SearchHistoryItem[]) =>
      set({ searchHistory: history }),

    addToSearchHistory: async (item: SearchHistoryItem) => {
      const { searchHistory, userData } = get();
      const filtered = searchHistory.filter(h => h.placeId !== item.placeId);
      const updatedHistory = [item, ...filtered].slice(0, 5);
      set({ searchHistory: updatedHistory });

      // Update backend if user is authenticated
      if (userData?.uid) {
        try {
          // Convert to backend format
          const backendHistoryItem: SearchHistoryItemEmbeddable = {
            placeId: item.placeId,
            mainText: item.mainText,
            secondaryText: item.secondaryText,
          };

          await userService.addSearchHistoryItem(
            userData.id.toString(),
            backendHistoryItem
          );
        } catch (err) {
          console.error('Error saving search history to backend:', err);
          // Optionally revert the local state on error
          // set({ searchHistory });
        }
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
    setLastUploadedPost: date => set({ lastUploadedPost: date }),
  }))
);
