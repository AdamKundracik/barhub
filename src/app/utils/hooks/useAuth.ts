// This hook is now deprecated - use useAuth from AuthProvider instead
// Keeping for backward compatibility during migration

import { useAuth as useNewAuth } from '../../providers/AuthProvider';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading } = useNewAuth();

  return {
    authUser: isAuthenticated,
    emailVerified: true, // Backend handles email verification differently
    isAuthLoading: isLoading,
    currentUser: user,
  };
};
