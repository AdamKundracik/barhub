import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useQueryClient } from 'react-query';
import {
  authService,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../services/authService';
import { userService } from '../services/userService';
import { pushTokenService } from '../services/pushTokenService';
import { useUserStore } from '../utils/store/userStore';
import { useLocationStore } from '../utils/store/locationStore';
import { getCoords } from '../utils/helper-functions/get-coords';
import { socialAuthService } from '../services/socialAuthService';
import { signInWithGoogleRN } from '../services/auth/googleSignInRN';
import {
  isAppleSignInAvailable,
  signInWithApple as appleSignIn,
} from '../services/auth/appleSignIn';
import { consentService } from '../services/consentService';
import { OutdatedConsentDTO } from '../types/dto';
import { axiosClient } from '../utils/api/axiosClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global reference to unsubscribe function (set by Navigation component)
let globalUnsubscribeNotifications: (() => void) | null = null;

export const setGlobalUnsubscribeNotifications = (fn: (() => void) | null) => {
  globalUnsubscribeNotifications = fn;
};

// Auth States
type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

// Types
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  registerWithPhoto: (
    credentials: RegisterCredentials,
    photoUri: string
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  pendingConsents: OutdatedConsentDTO[] | null;
  setPendingConsents: (consents: OutdatedConsentDTO[] | null) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [pendingConsents, setPendingConsents] = useState<
    OutdatedConsentDTO[] | null
  >(null);

  const queryClient = useQueryClient();
  const { setUserData, updateCanSeeContent } = useUserStore();
  const {
    setUseFakeLocation,
    setFakeLocationName,
    setFakeLocation,
    setInitialized,
  } = useLocationStore();

  // Derived states
  const isAuthenticated = authState === 'authenticated';
  const isLoading = authState === 'loading';

  // ========== Helper Functions ==========

  const clearAuthState = useCallback(() => {
    setAuthState('unauthenticated');
    setUser(null);
    setUserData(null);
    setUseFakeLocation(false);
    setFakeLocationName('');
    setInitialized(false);
    queryClient.clear();
  }, [
    setUserData,
    setUseFakeLocation,
    setFakeLocationName,
    setInitialized,
    queryClient,
  ]);

  const setAuthenticatedState = useCallback(async (userData: User) => {
    // Set user data first, then auth state - this ensures Navigation has user data when isAuthenticated becomes true
    setUser(userData);
    setAuthState('authenticated');

    // Initialize user-related services in background
    Promise.allSettled([
      initializeUserStores(userData),
      pushTokenService.initialize(userData.id.toString()),
      loadConsentStatus(userData.id.toString()),
    ]).catch(error => {
      console.error('Background initialization error:', error);
    });
  }, []);

  const initializeUserStores = useCallback(
    async (userData: User): Promise<void> => {
      try {
        // Load user data and location in parallel
        const [userDataResult, locationResult] = await Promise.allSettled([
          userService.getCurrentUser(),
          getCoords().then(location =>
            userService.updateLocation(userData.id.toString(), location)
          ),
        ]);

        // Handle user data
        if (userDataResult.status === 'fulfilled' && userDataResult.value) {
          const appUserData = userDataResult.value;
          setUserData(appUserData);
          updateCanSeeContent();

          // Handle fake location
          if (appUserData.usingFakeLocation) {
            setUseFakeLocation(true);
            try {
              const savedPlaceJson =
                await AsyncStorage.getItem('fakeLocationPlace');
              if (savedPlaceJson) {
                const savedPlace = JSON.parse(savedPlaceJson);
                setFakeLocation({
                  latitude: savedPlace.latitude,
                  longitude: savedPlace.longitude,
                });
                const name =
                  savedPlace.fakeLocationName || savedPlace.placeName;
                if (name) setFakeLocationName(name);
              }
            } catch (error) {
              console.error('Error loading fake location:', error);
            }
          }
        }

        setInitialized(true);
      } catch (error) {
        console.error('User stores initialization error:', error);
      }
    },
    [
      setUserData,
      updateCanSeeContent,
      setUseFakeLocation,
      setFakeLocation,
      setFakeLocationName,
      setInitialized,
    ]
  );

  const loadConsentStatus = useCallback(
    async (userId: string): Promise<void> => {
      try {
        const consentStatus = await consentService.getConsentStatus(userId);
        const outdated = consentStatus.consents
          .filter(c => !c.accepted || c.needsUpdate)
          .map(c => ({
            consentType: c.consentType,
            currentVersion: c.currentVersion,
            userAcceptedVersion: c.acceptedVersion,
            needsUpdate: c.needsUpdate,
          }));

        if (outdated.length > 0) setPendingConsents(outdated);
      } catch (error) {
        console.error('Consent check error:', error);
      }
    },
    []
  );

  // ========== Authentication Methods ==========

  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      // Simple check: do we have a valid session?
      const isValid = await authService.validateSession();

      if (isValid) {
        // Get user data
        const userData = await authService.getCurrentUser();
        if (userData) {
          await setAuthenticatedState(userData);
        } else {
          clearAuthState();
        }
      } else {
        clearAuthState();
      }
    } catch (error) {
      console.error('Auth status check error:', error);
      clearAuthState();
    }
  }, [setAuthenticatedState, clearAuthState]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setAuthState('loading');

        const authResponse = await authService.login(credentials);

        // Handle consents
        if (
          authResponse.consentStatus?.consentsRequired &&
          authResponse.consentStatus.outdatedConsents.length > 0
        ) {
          setPendingConsents(authResponse.consentStatus.outdatedConsents);
        }

        // Get user data and set authenticated state
        const userData =
          authResponse.user || (await authService.getCurrentUser());
        if (userData) {
          await setAuthenticatedState(userData);
        } else {
          throw new Error('Failed to get user data after login');
        }
      } catch (error) {
        clearAuthState();
        throw error;
      }
    },
    [setAuthenticatedState, clearAuthState]
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      try {
        setAuthState('loading');

        const authResponse = await authService.register(credentials);
        const userData =
          authResponse.user || (await authService.getCurrentUser());

        if (userData) {
          await setAuthenticatedState(userData);
        } else {
          throw new Error('Failed to get user data after registration');
        }
      } catch (error) {
        clearAuthState();
        throw error;
      }
    },
    [setAuthenticatedState, clearAuthState]
  );

  const registerWithPhoto = useCallback(
    async (credentials: RegisterCredentials, photoUri: string) => {
      try {
        setAuthState('loading');

        const authResponse = await authService.registerWithPhoto(
          credentials,
          photoUri
        );
        const userData =
          authResponse.user || (await authService.getCurrentUser());

        if (userData) {
          await setAuthenticatedState(userData);
        } else {
          throw new Error('Failed to get user data after registration');
        }
      } catch (error) {
        clearAuthState();
        throw error;
      }
    },
    [setAuthenticatedState, clearAuthState]
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      setAuthState('loading');

      const googleUser = await signInWithGoogleRN();
      if (!googleUser) {
        clearAuthState();
        return;
      }

      const authResponse = await socialAuthService.signInWithGoogle(
        googleUser.idToken,
        googleUser.email,
        googleUser.name,
        googleUser.photoUrl
      );

      // Handle consents
      if (
        authResponse.consentStatus?.consentsRequired &&
        authResponse.consentStatus.outdatedConsents.length > 0
      ) {
        setPendingConsents(authResponse.consentStatus.outdatedConsents);
      }

      await authService.handleSocialAuthResponse(authResponse);
      const userData =
        authResponse.user || (await authService.getCurrentUser());

      if (userData) {
        await setAuthenticatedState(userData);
      } else {
        throw new Error('Failed to get user data after Google sign-in');
      }
    } catch (error) {
      clearAuthState();
      throw error;
    }
  }, [setAuthenticatedState, clearAuthState]);

  const signInWithApple = useCallback(async () => {
    try {
      setAuthState('loading');

      const isAvailable = await isAppleSignInAvailable();
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      const appleUser = await appleSignIn();
      if (!appleUser) {
        clearAuthState();
        return;
      }

      const authResponse = await socialAuthService.signInWithApple(
        appleUser.idToken,
        appleUser.email,
        appleUser.name,
        appleUser.appleUserId
      );

      // Handle consents
      if (
        authResponse.consentStatus?.consentsRequired &&
        authResponse.consentStatus.outdatedConsents.length > 0
      ) {
        setPendingConsents(authResponse.consentStatus.outdatedConsents);
      }

      await authService.handleSocialAuthResponse(authResponse);
      const userData =
        authResponse.user || (await authService.getCurrentUser());

      if (userData) {
        await setAuthenticatedState(userData);
      } else {
        throw new Error('Failed to get user data after Apple sign-in');
      }
    } catch (error) {
      clearAuthState();
      throw error;
    }
  }, [setAuthenticatedState, clearAuthState]);

  const logout = useCallback(async () => {
    try {
      setAuthState('loading');

      // Unsubscribe from notifications
      if (globalUnsubscribeNotifications) {
        globalUnsubscribeNotifications();
      }

      // Cleanup push tokens
      if (user) {
        try {
          await pushTokenService.removePushTokenFromBackend(user.id.toString());
        } catch (error) {
          console.error('Push token removal error:', error);
        }
      }

      // Backend logout
      await authService.logout();

      // Clear all state
      clearAuthState();
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear state even if logout fails
      clearAuthState();
    }
  }, [user, clearAuthState]);

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        await initializeUserStores(userData);
      } else {
        clearAuthState();
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      // Check if we're still authenticated
      await checkAuthStatus();
    }
  }, [isAuthenticated, initializeUserStores, clearAuthState, checkAuthStatus]);

  // ========== Effects ==========

  // Initialize auth on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Set up logout callback for token refresh failures
  useEffect(() => {
    axiosClient.setOnTokenRefreshFailure(() => {
      console.log('Token refresh failed, logging out');
      clearAuthState();
    });
  }, [clearAuthState]);

  // ========== Context Value ==========

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    registerWithPhoto,
    signInWithGoogle,
    signInWithApple,
    logout,
    refreshUser,
    pendingConsents,
    setPendingConsents,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return null;
    if (!isAuthenticated) return null;

    return <Component {...props} />;
  };
};