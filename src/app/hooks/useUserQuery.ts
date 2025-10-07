import { useMutation, useQuery, useQueryClient } from 'react-query';
import { userService } from '../services/userService';
import { useUserStore } from '../utils/store/userStore';
import { useAuth } from '../providers/AuthProvider';
import { ClientDTO, SearchHistoryItemEmbeddable } from '../types/dto';

// Query keys
export const USER_QUERY_KEYS = {
  userData: ['user', 'data'] as const,
  userById: (id: string) => ['user', 'data', id] as const,
  pushTokens: (userId: string) => ['user', 'pushTokens', userId] as const,
  location: (userId: string) => ['user', 'location', userId] as const,
  searchHistory: (userId: string) => ['user', 'searchHistory', userId] as const,
};

// Main user data query hook
export const useUserQuery = () => {
  const { isAuthenticated } = useAuth();
  const { setUserData, setUserDataLoading, updateCanSeeContent } =
    useUserStore();

  return useQuery({
    queryKey: USER_QUERY_KEYS.userData,
    queryFn: async (): Promise<ClientDTO | null> => {
      console.log('[useUserQuery] Fetching user data from backend');
      const userData = await userService.getCurrentUser();

      // Update Zustand store with fetched data
      if (userData) {
        setUserData(userData);
        updateCanSeeContent();
      }

      return userData;
    },
    enabled: isAuthenticated, // Only run when user is authenticated
    staleTime: 30 * 1000, // 30 seconds (shorter for webhook updates)
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds to catch webhook updates
    refetchOnWindowFocus: true, // Refresh when app comes to foreground
    refetchOnReconnect: true,
    retry: 2,
    onSuccess: data => {
      console.log('[useUserQuery] User data fetched successfully');
      if (data) {
        setUserData(data);
        updateCanSeeContent();
      }
    },
    onError: error => {
      console.error('[useUserQuery] Error fetching user data:', error);
      setUserData(null);
    },
    onSettled: () => {
      setUserDataLoading(false);
    },
  });
};

// Mutation hooks for user data updates
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  const { updateUserData, getUserId } = useUserStore();

  return useMutation({
    mutationFn: async (updates: Partial<ClientDTO>) => {
      const userId = getUserId();
      if (!userId) throw new Error('User not authenticated');

      console.log('[useUpdateUserMutation] Updating user data:', updates);

      // Call backend API to update user
      const updatedUser = await userService.updateUser(userId, updates);
      if (!updatedUser) throw new Error('Failed to update user');

      return updatedUser;
    },
    onMutate: async updates => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(USER_QUERY_KEYS.userData);

      // Snapshot the previous value
      const previousUserData = queryClient.getQueryData<ClientDTO>(
        USER_QUERY_KEYS.userData
      );

      // Optimistically update to the new value
      if (previousUserData) {
        const optimisticData = { ...previousUserData, ...updates };
        queryClient.setQueryData(USER_QUERY_KEYS.userData, optimisticData);
        updateUserData(updates);
      }

      // Return a context object with the snapshotted value
      return { previousUserData };
    },
    onError: (error, updates, context) => {
      console.error('[useUpdateUserMutation] Error updating user:', error);

      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUserData) {
        queryClient.setQueryData(
          USER_QUERY_KEYS.userData,
          context.previousUserData
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries(USER_QUERY_KEYS.userData);
    },
  });
};

// Profile update mutation (name, photo, date of birth)
export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  const { updateUserData, getUserId } = useUserStore();

  return useMutation({
    mutationFn: async (profileData: {
      name?: string;
      photoUrl?: string;
      dateOfBirth?: string;
    }) => {
      const userId = getUserId();
      if (!userId) throw new Error('User not authenticated');

      console.log('[useUpdateProfileMutation] Updating profile:', profileData);

      const updatedUser = await userService.updateProfile(userId, profileData);
      if (!updatedUser) throw new Error('Failed to update profile');

      return updatedUser;
    },
    onMutate: async profileData => {
      await queryClient.cancelQueries(USER_QUERY_KEYS.userData);
      const previousUserData = queryClient.getQueryData<ClientDTO>(
        USER_QUERY_KEYS.userData
      );

      if (previousUserData) {
        const optimisticData = { ...previousUserData, ...profileData };
        queryClient.setQueryData(USER_QUERY_KEYS.userData, optimisticData);
        updateUserData(profileData);
      }

      return { previousUserData };
    },
    onError: (error, profileData, context) => {
      console.error(
        '[useUpdateProfileMutation] Error updating profile:',
        error
      );
      if (context?.previousUserData) {
        queryClient.setQueryData(
          USER_QUERY_KEYS.userData,
          context.previousUserData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(USER_QUERY_KEYS.userData);
    },
  });
};

// Photo update mutations
export const usePhotoMutations = () => {
  const queryClient = useQueryClient();
  const { updateUserData, getUserId } = useUserStore();

  const updatePhoto = useMutation({
    mutationFn: async (photoUrl: string) => {
      const userId = getUserId();
      if (!userId) throw new Error('User not authenticated');

      console.log('[usePhotoMutations] Updating photo:', photoUrl);

      const updatedUser = await userService.updatePhoto(userId, photoUrl);
      if (!updatedUser) throw new Error('Failed to update photo');

      return updatedUser;
    },
    onMutate: async photoUrl => {
      await queryClient.cancelQueries(USER_QUERY_KEYS.userData);
      const previousUserData = queryClient.getQueryData<ClientDTO>(
        USER_QUERY_KEYS.userData
      );

      if (previousUserData) {
        const optimisticData = { ...previousUserData, photoUrl };
        queryClient.setQueryData(USER_QUERY_KEYS.userData, optimisticData);
        updateUserData({ photoUrl });
      }

      return { previousUserData };
    },
    onError: (error, photoUrl, context) => {
      console.error('[usePhotoMutations] Error updating photo:', error);
      if (context?.previousUserData) {
        queryClient.setQueryData(
          USER_QUERY_KEYS.userData,
          context.previousUserData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(USER_QUERY_KEYS.userData);
    },
  });

  const deletePhoto = useMutation({
    mutationFn: async () => {
      const userId = getUserId();
      if (!userId) throw new Error('User not authenticated');

      console.log('[usePhotoMutations] Deleting photo');

      const updatedUser = await userService.deletePhoto(userId);
      if (!updatedUser) throw new Error('Failed to delete photo');

      return updatedUser;
    },
    onMutate: async () => {
      await queryClient.cancelQueries(USER_QUERY_KEYS.userData);
      const previousUserData = queryClient.getQueryData<ClientDTO>(
        USER_QUERY_KEYS.userData
      );

      if (previousUserData) {
        const optimisticData = { ...previousUserData, photoUrl: undefined };
        queryClient.setQueryData(USER_QUERY_KEYS.userData, optimisticData);
        updateUserData({ photoUrl: undefined });
      }

      return { previousUserData };
    },
    onError: (error, variables, context) => {
      console.error('[usePhotoMutations] Error deleting photo:', error);
      if (context?.previousUserData) {
        queryClient.setQueryData(
          USER_QUERY_KEYS.userData,
          context.previousUserData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(USER_QUERY_KEYS.userData);
    },
  });

  return { updatePhoto, deletePhoto };
};

// Push token mutations
export const usePushTokenMutations = () => {
  const queryClient = useQueryClient();
  const { getUserId } = useUserStore();

  const addPushToken = useMutation({
    mutationFn: async (token: string) => {
      const userId = getUserId();
      if (!userId) throw new Error('User not authenticated');

      return await userService.addPushToken(userId, token);
    },
    onSuccess: (_, token) => {
      const userId = getUserId();
      if (userId) {
        queryClient.invalidateQueries(USER_QUERY_KEYS.pushTokens(userId));
      }
    },
  });

  const getPushTokens = (userId: string) =>
    useQuery({
      queryKey: USER_QUERY_KEYS.pushTokens(userId),
      queryFn: () => userService.getPushTokens(userId),
      enabled: !!userId,
      staleTime: 10 * 60 * 1000, // 10 minutes
    });

  return { addPushToken, getPushTokens };
};

// Location mutations
export const useLocationMutations = () => {
  const queryClient = useQueryClient();
  const { getUserId, updateUserData } = useUserStore();

  const updateLocation = useMutation({
    mutationFn: async (location: { latitude: number; longitude: number }) => {
      const userId = getUserId();
      if (!userId) throw new Error('User not authenticated');

      const success = await userService.updateLocation(userId, location);
      if (!success) throw new Error('Failed to update location');

      return location;
    },
    onSuccess: location => {
      // Update local state
      updateUserData({
        // Note: Backend doesn't have location field in ClientDTO
        // You might need to add it or handle it differently
      });

      const userId = getUserId();
      if (userId) {
        queryClient.invalidateQueries(USER_QUERY_KEYS.location(userId));
      }
    },
  });

  const getLocation = (userId: string) =>
    useQuery({
      queryKey: USER_QUERY_KEYS.location(userId),
      queryFn: () => userService.getLocation(userId),
      enabled: !!userId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

  return { updateLocation, getLocation };
};

// Search history mutations
export const useSearchHistoryMutations = () => {
  const queryClient = useQueryClient();
  const { getUserId, updateUserData } = useUserStore();

  const addSearchHistoryItem = useMutation({
    mutationFn: async (item: SearchHistoryItemEmbeddable) => {
      const userId = getUserId();
      if (!userId) throw new Error('User not authenticated');

      console.log(
        '[useSearchHistoryMutations] Adding search history item:',
        item
      );

      const success = await userService.addSearchHistoryItem(userId, item);
      if (!success) throw new Error('Failed to add search history item');

      return item;
    },
    onMutate: async item => {
      // Cancel any outgoing refetches
      const userId = getUserId();
      if (userId) {
        await queryClient.cancelQueries(USER_QUERY_KEYS.searchHistory(userId));

        // Snapshot the previous value
        const previousHistory = queryClient.getQueryData<
          SearchHistoryItemEmbeddable[]
        >(USER_QUERY_KEYS.searchHistory(userId));

        // Optimistically update to the new value
        if (previousHistory) {
          const filtered = previousHistory.filter(
            h => h.placeId !== item.placeId
          );
          const optimisticHistory = [item, ...filtered].slice(0, 20);
          queryClient.setQueryData(
            USER_QUERY_KEYS.searchHistory(userId),
            optimisticHistory
          );

          // Update local store as well
          updateUserData({ searchHistory: optimisticHistory });
        }

        return { previousHistory };
      }
    },
    onError: (error, item, context) => {
      console.error(
        '[useSearchHistoryMutations] Error adding search history item:',
        error
      );

      // If the mutation fails, use the context returned from onMutate to roll back
      const userId = getUserId();
      if (userId && context?.previousHistory) {
        queryClient.setQueryData(
          USER_QUERY_KEYS.searchHistory(userId),
          context.previousHistory
        );

        // Revert local store
        updateUserData({ searchHistory: context.previousHistory });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      const userId = getUserId();
      if (userId) {
        queryClient.invalidateQueries(USER_QUERY_KEYS.searchHistory(userId));
        queryClient.invalidateQueries(USER_QUERY_KEYS.userData);
      }
    },
  });

  const getSearchHistory = (userId: string) =>
    useQuery({
      queryKey: USER_QUERY_KEYS.searchHistory(userId),
      queryFn: () => userService.getSearchHistory(userId),
      enabled: !!userId,
      staleTime: 10 * 60 * 1000, // 10 minutes
    });

  // Backward compatibility
  const updateSearchHistory = useMutation({
    mutationFn: async (searchHistory: SearchHistoryItemEmbeddable[]) => {
      console.warn(
        'updateSearchHistory is deprecated, use addSearchHistoryItem instead'
      );
      if (searchHistory.length > 0) {
        return addSearchHistoryItem.mutateAsync(searchHistory[0]);
      }
      throw new Error('No search history items provided');
    },
  });

  return { addSearchHistoryItem, updateSearchHistory, getSearchHistory };
};

// Delete account mutation
export const useDeleteAccountMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('[useDeleteAccountMutation] Deleting user account');

      const success = await userService.deleteCurrentUser();
      if (!success) throw new Error('Failed to delete user account');

      return true;
    },
    onSuccess: () => {
      console.log('[useDeleteAccountMutation] Account deleted successfully');

      // Clear all cached data
      queryClient.clear();

      // Note: Navigation to auth screen should be handled by the component
    },
    onError: error => {
      console.error(
        '[useDeleteAccountMutation] Error deleting account:',
        error
      );
    },
  });
};

// Combined hook for easy access to all user-related queries and mutations
export const useUserData = () => {
  const userQuery = useUserQuery();
  const updateUserMutation = useUpdateUserMutation();
  const updateProfileMutation = useUpdateProfileMutation();
  const photoMutations = usePhotoMutations();
  const pushTokenMutations = usePushTokenMutations();
  const locationMutations = useLocationMutations();
  const searchHistoryMutations = useSearchHistoryMutations();
  const deleteAccountMutation = useDeleteAccountMutation();

  const {
    userData,
    isUserDataLoading,
    isPremium,
    getDisplayName,
    getEmail,
    getPhotoUrl,
    getUserId,
    canSeeContent,
  } = useUserStore();

  return {
    // Data
    userData,
    isLoading: isUserDataLoading || userQuery.isLoading,
    isError: userQuery.isError,
    error: userQuery.error,

    // Computed values
    isPremium: isPremium(),
    displayName: getDisplayName(),
    email: getEmail(),
    photoUrl: getPhotoUrl(),
    userId: getUserId(),
    canSeeContent,

    // Actions
    refetch: userQuery.refetch,

    // User updates
    updateUser: updateUserMutation.mutate,
    isUpdating: updateUserMutation.isLoading,
    updateUserAsync: updateUserMutation.mutateAsync,

    // Profile updates (name, photo, date of birth)
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isLoading,
    updateProfileAsync: updateProfileMutation.mutateAsync,

    // Photo updates
    updatePhoto: photoMutations.updatePhoto.mutate,
    deletePhoto: photoMutations.deletePhoto.mutate,
    isUpdatingPhoto: photoMutations.updatePhoto.isLoading,
    isDeletingPhoto: photoMutations.deletePhoto.isLoading,
    updatePhotoAsync: photoMutations.updatePhoto.mutateAsync,
    deletePhotoAsync: photoMutations.deletePhoto.mutateAsync,

    // Push tokens
    addPushToken: pushTokenMutations.addPushToken.mutate,

    // Location
    updateLocation: locationMutations.updateLocation.mutate,

    // Search history
    addSearchHistoryItem: searchHistoryMutations.addSearchHistoryItem.mutate,
    addSearchHistoryItemAsync:
      searchHistoryMutations.addSearchHistoryItem.mutateAsync,
    isAddingSearchHistoryItem:
      searchHistoryMutations.addSearchHistoryItem.isLoading,
    updateSearchHistory: searchHistoryMutations.updateSearchHistory.mutate, // deprecated

    // Account management
    deleteAccount: deleteAccountMutation.mutate,
    deleteAccountAsync: deleteAccountMutation.mutateAsync,
    isDeletingAccount: deleteAccountMutation.isLoading,
  };
};
