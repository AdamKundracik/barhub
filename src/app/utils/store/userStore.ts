import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  ClientDTO,
  RoleEnum,
  SearchHistoryItemEmbeddable,
} from '../../types/dto';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { PremiumHelpers } from '../../config/premiumConfig';

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

  // Block user management
  blockedUsers: Set<string>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isUserBlocked: (userId: string) => boolean;
  setBlockedUsers: (blockedUserIds: string[]) => void;
  loadBlockedUsers: () => Promise<void>;

  // Helper getters
  getDisplayName: () => string;
  getEmail: () => string;
  getPhotoUrl: () => string | undefined;
  getUserId: () => string | null;
}

export const useUserStore = create<UserStore>()(
  subscribeWithSelector((set, get) => {
    // Set up callback for authService to update user data
    authService.setUserDataUpdateCallback((userData: ClientDTO | null) => {
      set({ userData });
    });

    return {
      // Initial state
      userData: null,
      isUserDataLoading: false,
      currentPushToken: null,
      canSeeContent: false,
      blockedUsers: new Set<string>(),

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
          const filtered = currentHistory.filter(
            h => h.placeId !== item.placeId
          );
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

        // If no user or missing post timestamp, default to false (except admins/mods)
        if (!userData || !userData.lastUploadedPostAt) {
          set({ canSeeContent: false });
          return;
        }

        // Admins a moderátori vždy vidia content
        if ([RoleEnum.ADMIN, RoleEnum.MODERATOR].includes(userData.role)) {
          set({ canSeeContent: true });
          return;
        }

        // Check if last uploaded post was within 7 days
        const lastUploadDate = new Date(userData.lastUploadedPostAt);
        const now = new Date();
        const daysDiff = Math.floor(
          (now.getTime() - lastUploadDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        set({ canSeeContent: daysDiff < 14 });
      },

      // Premium status management
      isPremium: () => {
        // If premium is disabled globally, always return true (all features available)
        if (!PremiumHelpers.isPremiumEnabled()) {
          return true;
        }

        // If premium is enabled, check actual user premium status
        const { userData } = get();
        return userData?.premium || false;
      },

      setPremium: (premium: boolean) => {
        const { userData } = get();
        if (!userData) return;

        // Update local state only
        // Backend is updated automatically via RevenueCat webhook
        get().updateUserData({ premium });
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
        return userData?.id.toString() || null;
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
        return (
          userData?.role === RoleEnum.ADMIN ||
          userData?.role === RoleEnum.MODERATOR
        );
      },

      // Block user management
      blockUser: async (userId: string) => {
        const { blockedUsers } = get();
        const newBlockedUsers = new Set(blockedUsers);
        newBlockedUsers.add(userId);
        set({ blockedUsers: newBlockedUsers });

        try {
          await userService.blockUser(userId);
        } catch (error) {
          console.error('Failed to block user:', error);
          // Revert optimistic update on error
          const revertedBlockedUsers = new Set(blockedUsers);
          revertedBlockedUsers.delete(userId);
          set({ blockedUsers: revertedBlockedUsers });
          throw error;
        }
      },

      unblockUser: async (userId: string) => {
        const { blockedUsers } = get();
        const newBlockedUsers = new Set(blockedUsers);
        newBlockedUsers.delete(userId);
        set({ blockedUsers: newBlockedUsers });

        try {
          await userService.unblockUser(userId);
        } catch (error) {
          console.error('Failed to unblock user:', error);
          // Revert optimistic update on error
          const revertedBlockedUsers = new Set(blockedUsers);
          revertedBlockedUsers.add(userId);
          set({ blockedUsers: revertedBlockedUsers });
          throw error;
        }
      },

      isUserBlocked: (userId: string) => {
        const { blockedUsers } = get();
        return blockedUsers.has(userId);
      },

      setBlockedUsers: (blockedUserIds: string[]) => {
        set({ blockedUsers: new Set(blockedUserIds) });
      },

      loadBlockedUsers: async () => {
        try {
          const blockedUsersData = await userService.getBlockedUsers();
          // Ensure blockedUsersData is an array before mapping
          if (Array.isArray(blockedUsersData)) {
            const blockedUserIds = blockedUsersData
              .map(user => user.id?.toString())
              .filter(Boolean);
            set({ blockedUsers: new Set(blockedUserIds) });
          } else {
            console.warn(
              'loadBlockedUsers: Expected array but got:',
              typeof blockedUsersData
            );
            set({ blockedUsers: new Set() });
          }
        } catch (error) {
          console.error('Failed to load blocked users:', error);
          set({ blockedUsers: new Set() });
        }
      },
    };
  })
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
  isModerator: (state: ReturnType<typeof useUserStore.getState>) =>
    state.isModerator(),
  isUser: (state: ReturnType<typeof useUserStore.getState>) => state.isUser(),
  hasAdminAccess: (state: ReturnType<typeof useUserStore.getState>) =>
    state.hasAdminAccess(),
  tutorialViewed: (state: ReturnType<typeof useUserStore.getState>) =>
    state.userData?.tutorialViewed || false,
  blockedUsers: (state: ReturnType<typeof useUserStore.getState>) =>
    state.blockedUsers,
  isUserBlocked:
    (userId: string) => (state: ReturnType<typeof useUserStore.getState>) =>
      state.isUserBlocked(userId),
};
