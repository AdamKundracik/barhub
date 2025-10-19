// DEPRECATED: This hook is deprecated - use useUserData from hooks/useUserQuery instead
// Keeping for backward compatibility during migration

import { useUserData as useNewUserData } from '../../hooks/useUserQuery';

export const useUserData = () => {
  const { userData, isLoading, refetch, isError, error } = useNewUserData();

  // Mock the old react-query interface for backward compatibility
  return {
    data: userData,
    isLoading,
    refetch,
    // Add other react-query properties as needed
    error,
    isError,
    isSuccess: !!userData,
  };
};
