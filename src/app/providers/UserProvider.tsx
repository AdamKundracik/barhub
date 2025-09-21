import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { User } from '../../../shared';
import { LocationType } from '../utils/types/types';
import { useLocationStore } from '../utils/store/locationStore';
import { useAuth } from '../utils/hooks/useAuth';
import { useUserData } from '../utils/hooks/useUserData';
import { useLocation } from '../utils/hooks/useLocation';

type UserContextType = {
  authUser: null | boolean;
  isLoading: boolean;
  location: LocationType | null;
  userData: User | null;
  emailVerified: boolean;
  fetchUserData: () => void;
  useFakeLocation: boolean;
  setUseFakeLocation: (val: boolean) => void;
  getCurrentLocation: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { authUser, emailVerified, isAuthLoading, currentUser } = useAuth();
  const {
    data: userData,
    isLoading: isUserLoading,
    refetch: refetchUserData,
  } = useUserData();

  const {
    location,
    setUseFakeLocation,
    setFakeLocationName,
    setLocation,
    setInitialized,
  } = useLocationStore();

  const { useFakeLocation, getCurrentLocation } = useLocation();

  // Initialize location store with user data

  const isLoading = isAuthLoading || isUserLoading;

  const contextValue = useMemo(
    () => ({
      userData: userData ?? null,
      isLoading,
      location: location,
      authUser,
      emailVerified,
      fetchUserData: refetchUserData,
      useFakeLocation,
      setUseFakeLocation,
      getCurrentLocation,
    }),
    [
      userData,
      isLoading,
      location,
      authUser,
      emailVerified,
      refetchUserData,
      useFakeLocation,
      setUseFakeLocation,
      getCurrentLocation,
    ]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
