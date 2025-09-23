import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { User } from '@/shared';
import { auth } from '@/firebaseConfig';

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

    setAuthUser: user => set({ authUser: user }),
    setAuthLoading: loading => set({ isAuthLoading: loading }),
    setUserData: (data: User | Partial<User>) => {
      set(state => ({
        userData: { ...state.userData, ...data } as User,
      }));
    },

    setPremium: (premium: boolean) => {
      set(state => ({
        premium: premium,
      }));
    },

    setCurrentPushToken: (token: string | null) => {
      set(state => ({
        currentPushToken: token,
      }));
    },

    setUserDataLoading: loading => set({ isUserDataLoading: loading }),
  }))
);
