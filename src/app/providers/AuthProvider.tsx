import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
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
import { tokenManager } from '@/src/app/utils/api/tokenManager';

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

  // Track isAuthenticated changes with logging (only log actual changes)
  const prevIsAuthenticatedRef = React.useRef<boolean | null>(null);
  useEffect(() => {
    // Only log if value actually changed
    if (prevIsAuthenticatedRef.current !== isAuthenticated) {
      prevIsAuthenticatedRef.current = isAuthenticated;
    }
  }, [isAuthenticated, authState, user]);

  // ========== Helper Functions ==========

  const clearAuthState = useCallback(() => {
    const previousAuthState = authState;
    const previousIsAuthenticated = isAuthenticated;
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
    authState,
    isAuthenticated,
    user,
  ]);

  const setAuthenticatedState = useCallback(
    async (userData: User) => {
      const previousAuthState = authState;
      const previousIsAuthenticated = isAuthenticated;

      // Skip if already authenticated with same user
      if (
        previousAuthState === 'authenticated' &&
        previousIsAuthenticated &&
        user?.id === userData.id
      ) {
        return;
      }

      // Set user data first, then auth state - this ensures Navigation has user data when isAuthenticated becomes true
      setUser(userData);
      setAuthState('authenticated');

      // Vypíš currentUser data pri autentifikácii
      console.log(
        '[AUTH] Current user data on authentication:',
        JSON.stringify(userData, null, 2)
      );

      // Initialize user-related services in background
      Promise.allSettled([
        initializeUserStores(userData),
        pushTokenService.initialize(userData.id.toString()),
        loadConsentStatus(userData.id.toString()),
      ]).catch(error => {
        console.error('Background initialization error:', error);
      });
    },
    [authState, isAuthenticated]
  );

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
        // Aj pri chybe nastavíme initialized na true, aby sa app nezasekol
        setInitialized(true);
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
    const currentAuthState = authState;
    const currentIsAuthenticated = isAuthenticated;

    // Get stack trace to see where this is called from
    const stackTrace = new Error().stack;
    const callerInfo = stackTrace?.split('\n')[2]?.trim() || 'unknown';

    // If already authenticated and have user, skip check
    if (
      currentAuthState === 'authenticated' &&
      currentIsAuthenticated &&
      user
    ) {
      return;
    }

    try {
      // Check if user has a valid session (token-based)
      // This is the ONLY source of truth for authentication
      const isValid = await authService.isAuthenticated();


      if (!isValid) {
        // Check if this is due to a temporary SecureStore error
        const hasTemporaryError = tokenManager.hasTemporarySecureStoreError();
        const lastError = tokenManager.getLastSecureStoreError();

        if (hasTemporaryError) {
          // Don't log out - wait for retry when app becomes active
          // Keep the loading state - tokenManager will retry when app becomes active
          // Do NOT call clearAuthState() here!
          return;
        }

        // No valid session = not authenticated (permanent failure)
        clearAuthState();
        return;
      }

      // Session is valid, now get user data (payload)
      // NO FALLBACK - only use fresh data from API
      try {
        const userData = await authService.getCurrentUser();

        if (userData) {
          await setAuthenticatedState(userData);
        } else {
          // getCurrentUser() returned null - this means network/server error, NOT auth error
          // Token is still valid, but we can't fetch user data right now
          // This should not happen during normal checkAuthStatus, but if it does,
          // we should clear auth state since we can't proceed without user data
          console.warn(
            '[AUTH] Valid session but no user data available (network/server error) - clearing auth state'
          );
          clearAuthState();
        }
      } catch (authError: any) {
        // getCurrentUser() threw an error - check if it's an auth error (401/403)
        if (
          authError?.response?.status === 401 ||
          authError?.response?.status === 403
        ) {
          // Authentication error - token is invalid
          console.error(
            '[AUTH] Authentication error (401/403) - token is invalid, clearing auth state'
          );
          clearAuthState();
          return;
        }

        // Other error - re-throw to be handled by outer catch
        throw authError;
      }
    } catch (error: any) {
      console.error('[AUTH] Auth status check error:', error);

      // Check if it's an authentication error
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        // Authentication error - token is invalid
        clearAuthState();
        return;
      }

      // On other errors, check if we still have a valid session
      // NO FALLBACK to cached user data - token is the only source of truth
      try {
        const hasValidSession = await authService.isAuthenticated();


        if (!hasValidSession) {
          // No valid session = not authenticated, clear everything
          clearAuthState();
          return;
        }

        // Session is valid but error occurred - try to get fresh user data one more time
        try {
          const userData = await authService.getCurrentUser();
          if (userData) {
            await setAuthenticatedState(userData);
            return;
          }
        } catch (retryError: any) {
          // If retry also fails with auth error, clear state
          if (
            retryError?.response?.status === 401 ||
            retryError?.response?.status === 403
          ) {
            console.error(
              '[AUTH] Retry also failed with auth error - clearing auth state'
            );
            clearAuthState();
            return;
          }
        }
      } catch (fallbackError) {
        console.error('[AUTH] Error during fallback check:', fallbackError);
      }

      // If we get here, something went wrong - clear auth state
      // Token is the only source of truth, no cached data fallback
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
    [setAuthenticatedState, clearAuthState, authState, isAuthenticated]
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
    [setAuthenticatedState, clearAuthState, authState, isAuthenticated]
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
    [setAuthenticatedState, clearAuthState, authState, isAuthenticated]
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
  }, [setAuthenticatedState, clearAuthState, authState, isAuthenticated]);

  const signInWithApple = useCallback(async () => {

    try {
      setAuthState('loading');

      const isAvailable = await isAppleSignInAvailable();
      if (!isAvailable) {
        const error = new Error(
          'Apple Sign-In is not available on this device'
        );
        throw error;
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
  }, [setAuthenticatedState, clearAuthState, authState, isAuthenticated]);

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
  }, [user, clearAuthState, authState, isAuthenticated]);

  const refreshUser = useCallback(async () => {

    if (!isAuthenticated) {
      return;
    }

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
  }, [
    isAuthenticated,
    initializeUserStores,
    clearAuthState,
    checkAuthStatus,
    authState,
    user,
  ]);

  // ========== Effects ==========

  // Initialize auth on mount - GUARANTEED to load tokens before UI renders
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[AUTH] Starting authentication initialization...');

        // CRITICAL: Preload tokens into memory first
        const hasTokens = await tokenManager.preloadTokens();
        console.log('[AUTH] Token preload result:', hasTokens);

        // Now check authentication status
        await checkAuthStatus();

        console.log('[AUTH] Authentication initialization complete');

        // Vypíš currentUser data pri spustení appky
        if (user) {
          console.log(
            '[AUTH] Current user data on app start:',
            JSON.stringify(user, null, 2)
          );
        } else {
          console.log('[AUTH] No current user - user is not authenticated');
        }
      } catch (error) {
        console.error('[AUTH] Initialization error:', error);
        // Even if preload fails, try auth check (might work with cached data)
        await checkAuthStatus();
      }
    };

    initializeAuth();
  }, [checkAuthStatus, authState, isAuthenticated, user]);

  // Re-check auth when app becomes active after a temporary SecureStore error
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const hadTemporaryErrorRef = useRef<boolean>(false);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const previousAppState = appStateRef.current;

      // Check if we're transitioning to active state
      if (
        previousAppState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Check if we had a temporary SecureStore error
        if (
          hadTemporaryErrorRef.current ||
          tokenManager.hasTemporarySecureStoreError()
        ) {

          // Reset the flag
          hadTemporaryErrorRef.current = false;

          // Retry token preload and auth check
          try {
            const hasTokens = await tokenManager.preloadTokens();

            if (hasTokens) {
              // Tokens loaded successfully, check auth status
              await checkAuthStatus();
            } else if (!tokenManager.hasTemporarySecureStoreError()) {
              // No tokens and no temporary error = user is logged out
              clearAuthState();
            }
            // If there's still a temporary error, we'll try again next time
          } catch (error) {
          }
        }
      }

      // Track if we have a temporary error when going to background
      if (
        nextAppState === 'background' &&
        tokenManager.hasTemporarySecureStoreError()
      ) {
        hadTemporaryErrorRef.current = true;
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [checkAuthStatus, clearAuthState, authState, isAuthenticated]);

  // Set up logout callback for token refresh failures
  useEffect(() => {
    axiosClient.setOnTokenRefreshFailure(() => {
      console.log('Token refresh failed, logging out');
      clearAuthState();
    });
  }, [clearAuthState, authState, isAuthenticated, user]);

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
