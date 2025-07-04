import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useEffect,
} from 'react';
import { User } from '../../../shared';
import { LocationType } from '../utils/types/types';
import { useLocationStore } from '../utils/store/locationStore';
import { useAuth } from '../utils/hooks/useAuth';
import { useAllUsers, useUserData } from '../utils/hooks/useUserData';
import { useLocation } from '../utils/hooks/useLocation';

type UserContextType = {
  authUser: null | boolean;
  isLoading: boolean;
  location: LocationType | null;
  userData: User | null;
  emailVerified: boolean;
  fetchUserData: () => void;
  fetchAllUsers: () => void;
  users: User[] | undefined;
  useFakeLocation: boolean;
  setUseFakeLocation: (val: boolean) => void;
  fakeLocation: LocationType | null;
  setFakeLocation: (loc: LocationType, name: string) => void;
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
  } = useUserData(currentUser?.uid);

  const {
    data: users,
    isLoading: isUsersLoading,
    refetch: fetchAllUsers,
  } = useAllUsers();

  const {
    currentLocation,
    useFakeLocation,
    fakeLocation,
    setUseFakeLocation,
    setFakeLocation,
    getCurrentLocation,
  } = useLocation();

  // Initialize location store with user data
  useEffect(() => {
    if (userData) {
      const locationStore = useLocationStore.getState();
      locationStore.setUseFakeLocation(userData.isUsingFakeLocation ?? false);
      locationStore.setFakeLocation(
        userData.fakeLocation ?? { latitude: 0, longitude: 0 },
        userData.fakeLocationName
      );
      locationStore.setInitialized(true);
    }
  }, [userData]);

  const isLoading = isAuthLoading || isUserLoading || isUsersLoading;

  const contextValue = useMemo(
    () => ({
      userData: userData ?? null,
      isLoading,
      location: currentLocation,
      authUser,
      emailVerified,
      fetchAllUsers,
      fetchUserData: refetchUserData,
      users,
      useFakeLocation,
      fakeLocation,
      setUseFakeLocation,
      setFakeLocation,
      getCurrentLocation,
    }),
    [
      userData,
      isLoading,
      currentLocation,
      authUser,
      emailVerified,
      fetchAllUsers,
      refetchUserData,
      users,
      useFakeLocation,
      fakeLocation,
      setUseFakeLocation,
      setFakeLocation,
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
