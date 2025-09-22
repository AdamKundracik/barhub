import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { User } from '@/shared';
import { auth } from '@/firebaseConfig';

interface UserStore {
  authUser: typeof auth.currentUser | null;
  isAuthLoading: boolean;

  userData: User | null;
  isUserDataLoading: boolean;

  setAuthUser: (user: typeof auth.currentUser | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setUserData: (data: Partial<User>) => void;
  setUserDataLoading: (loading: boolean) => void;

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

    setAuthUser: user => set({ authUser: user }),
    setAuthLoading: loading => set({ isAuthLoading: loading }),
    setUserData: (data: User | Partial<User>) => {
      set(state => ({
        userData: { ...state.userData, ...data } as User,
      }));
    },

    setCurrentPushToken: (token: string | null) => {
      set(state => ({
        currentPushToken: token,
      }));
    },

    setUserDataLoading: loading => set({ isUserDataLoading: loading }),

    // Fetch user data
    // fetchUserData: async () => {
    //   const { authUser, queryClient } = get();
    //   if (!authUser?.uid) return;
    //
    //   set({ isUserDataLoading: true });
    //
    //   try {
    //     // Try to get from cache first
    //     const cachedData = queryClient?.getQueryData<User>([
    //       'userData',
    //       authUser.uid,
    //     ]);
    //
    //     if (cachedData) {
    //       set({ userData: cachedData, isUserDataLoading: false });
    //     }
    //
    //     console.log('STORE USER DATA', get().userData?.isUsingFakeLocation);
    //
    //     // Fetch fresh data
    //     const freshData = await getCurrentUser();
    //
    //     if (freshData) {
    //       // Update cache
    //       queryClient?.setQueryData(['userData', authUser.uid], freshData);
    //       // Update store
    //       set({ userData: freshData });
    //     }
    //   } catch (error) {
    //     console.error('Failed to fetch user data:', error);
    //   } finally {
    //     set({ isUserDataLoading: false });
    //   }
    // },

    // Refresh user data (force refetch)
    // refreshUserData: async () => {
    //   const { authUser, queryClient } = get();
    //   if (!authUser?.uid) return;
    //
    //   // Invalidate cache to force refetch
    //   await queryClient?.invalidateQueries(['userData', authUser.uid]);
    //   await get().fetchUserData();
    // },
  }))
);
