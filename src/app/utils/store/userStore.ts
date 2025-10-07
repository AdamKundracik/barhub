import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ClientDTO, SearchHistoryItemEmbeddable, RoleEnum } from '../../types/dto';
import { userService } from '../../services/userService';

// Updated UserStore interface using backend DTO
interface UserStore {
  // User data from backend DTO
  userData: ClientDTO | null;
  isUserDataLoading: boolean;

  // Actions
  setUserData: (data: ClientDTO | null) => void;
  setUserDataLoading: (loading: boolean) => void;
  updateUserData: (data: Partial<ClientDTO>) => void;

  // Push token management
  currentPushToken: string | null;
  setCurrentPushToken: (token: string | null) => void;

  // Search history (using backend DTO type)
  addToSearchHistory: (item: SearchHistoryItemEmbeddable) => Promise<void>;
  updateSearchHistory: (history: SearchHistoryItemEmbeddable[]) => void;

  // Content visibility based on last uploaded post
  canSeeContent: boolean;
  updateCanSeeContent: () => void;

  // Premium status
  isPremium: () => boolean;
  setPremium: (premium: boolean) => void;

  // Role management
  getRole: () => RoleEnum | null;
  isAdmin: () => boolean;
  isModerator: () => boolean;
  isUser: () => boolean;
  hasAdminAccess: () => boolean; // Admin or Moderator

  // Helper getters
  getDisplayName: () => string;
  getEmail: () => string;
  getPhotoUrl: () => string | undefined;
  getUserId: () => string | null;
}

export const useUserStore = create<UserStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    userData: null,
    isUserDataLoading: false,
    currentPushToken: null,
    canSeeContent: false,

    // Actions
    setUserData: (data: ClientDTO | null) => {
      set({ userData: data });
      // Update content visibility when user data changes
      if (data) {
        get().updateCanSeeContent();
      }
    },

    setUserDataLoading: (loading: boolean) => {
      set({ isUserDataLoading: loading });
    },

    updateUserData: (data: Partial<ClientDTO>) => {
      const currentData = get().userData;
      if (currentData) {
        const updatedData = { ...currentData, ...data };
        set({ userData: updatedData });
        get().updateCanSeeContent();
      }
    },

    setCurrentPushToken: (token: string | null) => {
      set({ currentPushToken: token });
    },

    addToSearchHistory: async (item: SearchHistoryItemEmbeddable) => {
      const { userData } = get();
      if (!userData) return;

      try {
        // Remove existing item with same placeId and add new one at the beginning
        const currentHistory = userData.searchHistory || [];
        const filtered = currentHistory.filter(h => h.placeId !== item.placeId);
        const updatedHistory = [item, ...filtered].slice(0, 5); // Keep only 5 items

        // Update local state
        get().updateUserData({ searchHistory: updatedHistory });

        // Update backend
        await userService.updateSearchHistory(
          userData.id.toString(),
          updatedHistory
        );
      } catch (error) {
        console.error('Error adding to search history:', error);
      }
    },

    updateSearchHistory: (history: SearchHistoryItemEmbeddable[]) => {
      get().updateUserData({ searchHistory: history });
    },

    updateCanSeeContent: () => {
      const { userData } = get();
      if (!userData || !userData.lastUploadedPostAt) {
        set({ canSeeContent: false });
        return;
      }

      // Check if last uploaded post was within 7 days
      const lastUploadDate = new Date(userData.lastUploadedPostAt);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - lastUploadDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      set({ canSeeContent: daysDiff < 7 });
    },

    // Premium status management
    isPremium: () => {
      const { userData } = get();
      return userData?.premium || false;
    },

    setPremium: (premium: boolean) => {
      const { userData } = get();
      if (!userData) return;

      // Update local state only
      // Backend is updated automatically via RevenueCat webhook
      get().updateUserData({ premium });
      console.log('[UserStore] Premium status updated locally:', premium);
    },

    getDisplayName: () => {
      const { userData } = get();
      return userData?.name || '';
    },

    getEmail: () => {
      const { userData } = get();
      return userData?.email || '';
    },

    getPhotoUrl: () => {
      const { userData } = get();
      return userData?.photoUrl;
    },

    getUserId: () => {
      const { userData } = get();
      return userData?.id?.toString() || null;
    },

    // Role management functions
    getRole: () => {
      const { userData } = get();
      return userData?.role || null;
    },

    isAdmin: () => {
      const { userData } = get();
      return userData?.role === RoleEnum.ADMIN;
    },

    isModerator: () => {
      const { userData } = get();
      return userData?.role === RoleEnum.MODERATOR;
    },

    isUser: () => {
      const { userData } = get();
      return userData?.role === RoleEnum.USER;
    },

    hasAdminAccess: () => {
      const { userData } = get();
      return userData?.role === RoleEnum.ADMIN || userData?.role === RoleEnum.MODERATOR;
    },
  }))
);

// Selectors for easy access
export const userSelectors = {
  userData: (state: ReturnType<typeof useUserStore.getState>) => state.userData,
  isLoading: (state: ReturnType<typeof useUserStore.getState>) =>
    state.isUserDataLoading,
  isPremium: (state: ReturnType<typeof useUserStore.getState>) =>
    state.isPremium(),
  displayName: (state: ReturnType<typeof useUserStore.getState>) =>
    state.getDisplayName(),
  email: (state: ReturnType<typeof useUserStore.getState>) => state.getEmail(),
  photoUrl: (state: ReturnType<typeof useUserStore.getState>) =>
    state.getPhotoUrl(),
  userId: (state: ReturnType<typeof useUserStore.getState>) =>
    state.getUserId(),
  searchHistory: (state: ReturnType<typeof useUserStore.getState>) =>
    state.userData?.searchHistory || [],
  canSeeContent: (state: ReturnType<typeof useUserStore.getState>) =>
    state.canSeeContent,
  role: (state: ReturnType<typeof useUserStore.getState>) => state.getRole(),
  isAdmin: (state: ReturnType<typeof useUserStore.getState>) => state.isAdmin(),
  isModerator: (state: ReturnType<typeof useUserStore.getState>) => state.isModerator(),
  isUser: (state: ReturnType<typeof useUserStore.getState>) => state.isUser(),
  hasAdminAccess: (state: ReturnType<typeof useUserStore.getState>) => state.hasAdminAccess(),
};
