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
import {
  logDebug,
  logInfo,
  logWarn,
  logError,
} from '../utils/store/logsStore';

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
      logDebug(
        'AuthProvider',
        `isAuthenticated changed: ${prevIsAuthenticatedRef.current} -> ${isAuthenticated}`,
        {
          authState,
          isAuthenticated,
          hasUser: !!user,
          userId: user?.id,
        }
      );
      prevIsAuthenticatedRef.current = isAuthenticated;
    }
  }, [isAuthenticated, authState, user]);

  // ========== Helper Functions ==========

  const clearAuthState = useCallback(() => {
    const previousAuthState = authState;
    const previousIsAuthenticated = isAuthenticated;
    
    logInfo(
      'AuthProvider',
      'clearAuthState called - setting authState to unauthenticated',
      {
        previousAuthState,
        previousIsAuthenticated,
        previousUserId: user?.id,
        stackTrace: new Error().stack,
      }
    );
    
    setAuthState('unauthenticated');
    setUser(null);
    setUserData(null);
    setUseFakeLocation(false);
    setFakeLocationName('');
    setInitialized(false);
    queryClient.clear();
    
    logInfo(
      'AuthProvider',
      'clearAuthState completed - isAuthenticated should now be false',
      {
        newAuthState: 'unauthenticated',
        newIsAuthenticated: false,
      }
    );
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

  const setAuthenticatedState = useCallback(async (userData: User) => {
    const previousAuthState = authState;
    const previousIsAuthenticated = isAuthenticated;
    
    // Skip if already authenticated with same user
    if (previousAuthState === 'authenticated' && previousIsAuthenticated && user?.id === userData.id) {
      logDebug(
        'AuthProvider',
        'setAuthenticatedState skipped - already authenticated with same user',
        {
          previousAuthState,
          previousIsAuthenticated,
          userId: userData.id,
        }
      );
      return;
    }
    
    logInfo(
      'AuthProvider',
      'setAuthenticatedState called - setting authState to authenticated',
      {
        previousAuthState,
        previousIsAuthenticated,
        userId: userData.id,
        userEmail: userData.email,
        stackTrace: new Error().stack,
      }
    );
    
    // Set user data first, then auth state - this ensures Navigation has user data when isAuthenticated becomes true
    setUser(userData);
    setAuthState('authenticated');
    
    logInfo(
      'AuthProvider',
      'setAuthenticatedState completed - isAuthenticated should now be true',
      {
        newAuthState: 'authenticated',
        newIsAuthenticated: true,
        userId: userData.id,
      }
    );

    // Initialize user-related services in background
    Promise.allSettled([
      initializeUserStores(userData),
      pushTokenService.initialize(userData.id.toString()),
      loadConsentStatus(userData.id.toString()),
    ]).catch(error => {
      console.error('Background initialization error:', error);
      logError(
        'AuthProvider',
        'Background initialization error in setAuthenticatedState',
        { userId: userData.id },
        error as Error
      );
    });
  }, [authState, isAuthenticated]);

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
    
    logDebug(
      'AuthProvider',
      'checkAuthStatus called',
      {
        currentAuthState,
        currentIsAuthenticated,
        currentUserId: user?.id,
        callerInfo,
        stackTrace: stackTrace?.split('\n').slice(0, 5).join('\n'),
      }
    );
    
    // If already authenticated and have user, skip check
    if (currentAuthState === 'authenticated' && currentIsAuthenticated && user) {
      logDebug(
        'AuthProvider',
        'checkAuthStatus skipped - already authenticated with user',
        {
          currentAuthState,
          currentIsAuthenticated,
          userId: user.id,
          callerInfo,
        }
      );
      return;
    }
    
    try {
      // Check if user has a valid session (token-based)
      // This is the ONLY source of truth for authentication
      const isValid = await authService.isAuthenticated();
      
      logDebug(
        'AuthProvider',
        'checkAuthStatus - isAuthenticated check result',
        {
          isValid,
          currentAuthState,
          currentIsAuthenticated,
        }
      );

      if (!isValid) {
        // Check if this is due to a temporary SecureStore error
        const hasTemporaryError = tokenManager.hasTemporarySecureStoreError();
        const lastError = tokenManager.getLastSecureStoreError();
        
        if (hasTemporaryError) {
          // Don't log out - wait for retry when app becomes active
          logWarn(
            'AuthProvider',
            'checkAuthStatus - Temporary SecureStore error, NOT clearing auth state. Will retry when app becomes active.',
            {
              currentAuthState,
              currentIsAuthenticated,
              temporaryError: lastError,
              reason: 'SecureStore temporarily unavailable (device locked, app in background, etc.)',
            }
          );
          // Keep the loading state - tokenManager will retry when app becomes active
          // Do NOT call clearAuthState() here!
          return;
        }
        
        // No valid session = not authenticated (permanent failure)
        logWarn(
          'AuthProvider',
          'checkAuthStatus - No valid session after refresh attempt, calling clearAuthState',
          {
            currentAuthState,
            currentIsAuthenticated,
            reason: 'isAuthenticated returned false - token refresh failed or no tokens available',
          }
        );
        clearAuthState();
        return;
      }

      // Session is valid, now get user data (payload)
      // NO FALLBACK - only use fresh data from API
      try {
        const userData = await authService.getCurrentUser();

        if (userData) {
          logInfo(
            'AuthProvider',
            'checkAuthStatus - User data retrieved, calling setAuthenticatedState',
            {
              userId: userData.id,
              currentAuthState,
              currentIsAuthenticated,
            }
          );
          await setAuthenticatedState(userData);
        } else {
          // getCurrentUser() returned null - this means network/server error, NOT auth error
          // Token is still valid, but we can't fetch user data right now
          // This should not happen during normal checkAuthStatus, but if it does,
          // we should clear auth state since we can't proceed without user data
          logWarn(
            'AuthProvider',
            'checkAuthStatus - Valid session but no user data available (network/server error) - clearing auth state',
            {
              currentAuthState,
              currentIsAuthenticated,
            }
          );
          console.warn('[AUTH] Valid session but no user data available (network/server error) - clearing auth state');
          clearAuthState();
        }
      } catch (authError: any) {
        // getCurrentUser() threw an error - check if it's an auth error (401/403)
        if (authError?.response?.status === 401 || authError?.response?.status === 403) {
          // Authentication error - token is invalid
          logError(
            'AuthProvider',
            'checkAuthStatus - Authentication error (401/403) - token is invalid, clearing auth state',
            {
              status: authError?.response?.status,
              currentAuthState,
              currentIsAuthenticated,
            },
            authError
          );
          console.error('[AUTH] Authentication error (401/403) - token is invalid, clearing auth state');
          clearAuthState();
          return;
        }
        
        // Other error - re-throw to be handled by outer catch
        throw authError;
      }
    } catch (error: any) {
      logError(
        'AuthProvider',
        'checkAuthStatus - Auth status check error',
        {
          currentAuthState,
          currentIsAuthenticated,
          errorStatus: error?.response?.status,
        },
        error
      );
      console.error('[AUTH] Auth status check error:', error);
      
      // Check if it's an authentication error
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        // Authentication error - token is invalid
        logInfo(
          'AuthProvider',
          'checkAuthStatus - Authentication error detected, clearing auth state',
          {
            status: error?.response?.status,
            currentAuthState,
            currentIsAuthenticated,
          }
        );
        clearAuthState();
        return;
      }
      
      // On other errors, check if we still have a valid session
      // NO FALLBACK to cached user data - token is the only source of truth
      try {
        const hasValidSession = await authService.isAuthenticated();
        
        logDebug(
          'AuthProvider',
          'checkAuthStatus - Fallback check for valid session',
          {
            hasValidSession,
            currentAuthState,
            currentIsAuthenticated,
          }
        );
        
        if (!hasValidSession) {
          // No valid session = not authenticated, clear everything
          logInfo(
            'AuthProvider',
            'checkAuthStatus - No valid session in fallback, clearing auth state',
            {
              currentAuthState,
              currentIsAuthenticated,
            }
          );
          clearAuthState();
          return;
        }

        // Session is valid but error occurred - try to get fresh user data one more time
        try {
          const userData = await authService.getCurrentUser();
          if (userData) {
            logInfo(
              'AuthProvider',
              'checkAuthStatus - Retry successful, calling setAuthenticatedState',
              {
                userId: userData.id,
                currentAuthState,
                currentIsAuthenticated,
              }
            );
            await setAuthenticatedState(userData);
            return;
          }
        } catch (retryError: any) {
          // If retry also fails with auth error, clear state
          if (retryError?.response?.status === 401 || retryError?.response?.status === 403) {
            logError(
              'AuthProvider',
              'checkAuthStatus - Retry also failed with auth error - clearing auth state',
              {
                status: retryError?.response?.status,
                currentAuthState,
                currentIsAuthenticated,
              },
              retryError
            );
            console.error('[AUTH] Retry also failed with auth error - clearing auth state');
            clearAuthState();
            return;
          }
        }
      } catch (fallbackError) {
        logError(
          'AuthProvider',
          'checkAuthStatus - Error during fallback check',
          {
            currentAuthState,
            currentIsAuthenticated,
          },
          fallbackError as Error
        );
        console.error('[AUTH] Error during fallback check:', fallbackError);
      }

      // If we get here, something went wrong - clear auth state
      // Token is the only source of truth, no cached data fallback
      logWarn(
        'AuthProvider',
        'checkAuthStatus - Final fallback, clearing auth state',
        {
          currentAuthState,
          currentIsAuthenticated,
        }
      );
      clearAuthState();
    }
  }, [setAuthenticatedState, clearAuthState]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      logInfo(
        'AuthProvider',
        'login called',
        {
          currentAuthState: authState,
          currentIsAuthenticated: isAuthenticated,
        }
      );
      
      try {
        logDebug(
          'AuthProvider',
          'login - Setting authState to loading',
          {
            previousAuthState: authState,
            previousIsAuthenticated: isAuthenticated,
          }
        );
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
          logInfo(
            'AuthProvider',
            'login - User data retrieved, calling setAuthenticatedState',
            {
              userId: userData.id,
            }
          );
          await setAuthenticatedState(userData);
        } else {
          logError(
            'AuthProvider',
            'login - Failed to get user data after login',
            {},
            new Error('Failed to get user data after login')
          );
          throw new Error('Failed to get user data after login');
        }
      } catch (error) {
        logError(
          'AuthProvider',
          'login - Error occurred, calling clearAuthState',
          {},
          error as Error
        );
        clearAuthState();
        throw error;
      }
    },
    [setAuthenticatedState, clearAuthState, authState, isAuthenticated]
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      logInfo(
        'AuthProvider',
        'register called',
        {
          currentAuthState: authState,
          currentIsAuthenticated: isAuthenticated,
        }
      );
      
      try {
        logDebug(
          'AuthProvider',
          'register - Setting authState to loading',
          {
            previousAuthState: authState,
            previousIsAuthenticated: isAuthenticated,
          }
        );
        setAuthState('loading');

        const authResponse = await authService.register(credentials);
        const userData =
          authResponse.user || (await authService.getCurrentUser());

        if (userData) {
          logInfo(
            'AuthProvider',
            'register - User data retrieved, calling setAuthenticatedState',
            {
              userId: userData.id,
            }
          );
          await setAuthenticatedState(userData);
        } else {
          logError(
            'AuthProvider',
            'register - Failed to get user data after registration',
            {},
            new Error('Failed to get user data after registration')
          );
          throw new Error('Failed to get user data after registration');
        }
      } catch (error) {
        logError(
          'AuthProvider',
          'register - Error occurred, calling clearAuthState',
          {},
          error as Error
        );
        clearAuthState();
        throw error;
      }
    },
    [setAuthenticatedState, clearAuthState, authState, isAuthenticated]
  );

  const registerWithPhoto = useCallback(
    async (credentials: RegisterCredentials, photoUri: string) => {
      logInfo(
        'AuthProvider',
        'registerWithPhoto called',
        {
          currentAuthState: authState,
          currentIsAuthenticated: isAuthenticated,
        }
      );
      
      try {
        logDebug(
          'AuthProvider',
          'registerWithPhoto - Setting authState to loading',
          {
            previousAuthState: authState,
            previousIsAuthenticated: isAuthenticated,
          }
        );
        setAuthState('loading');

        const authResponse = await authService.registerWithPhoto(
          credentials,
          photoUri
        );
        const userData =
          authResponse.user || (await authService.getCurrentUser());

        if (userData) {
          logInfo(
            'AuthProvider',
            'registerWithPhoto - User data retrieved, calling setAuthenticatedState',
            {
              userId: userData.id,
            }
          );
          await setAuthenticatedState(userData);
        } else {
          logError(
            'AuthProvider',
            'registerWithPhoto - Failed to get user data after registration',
            {},
            new Error('Failed to get user data after registration')
          );
          throw new Error('Failed to get user data after registration');
        }
      } catch (error) {
        logError(
          'AuthProvider',
          'registerWithPhoto - Error occurred, calling clearAuthState',
          {},
          error as Error
        );
        clearAuthState();
        throw error;
      }
    },
    [setAuthenticatedState, clearAuthState, authState, isAuthenticated]
  );

  const signInWithGoogle = useCallback(async () => {
    logInfo(
      'AuthProvider',
      'signInWithGoogle called',
      {
        currentAuthState: authState,
        currentIsAuthenticated: isAuthenticated,
      }
    );
    
    try {
      logDebug(
        'AuthProvider',
        'signInWithGoogle - Setting authState to loading',
        {
          previousAuthState: authState,
          previousIsAuthenticated: isAuthenticated,
        }
      );
      setAuthState('loading');

      const googleUser = await signInWithGoogleRN();
      if (!googleUser) {
        logWarn(
          'AuthProvider',
          'signInWithGoogle - No googleUser returned, calling clearAuthState',
          {}
        );
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
        logInfo(
          'AuthProvider',
          'signInWithGoogle - User data retrieved, calling setAuthenticatedState',
          {
            userId: userData.id,
          }
        );
        await setAuthenticatedState(userData);
      } else {
        logError(
          'AuthProvider',
          'signInWithGoogle - Failed to get user data after Google sign-in',
          {},
          new Error('Failed to get user data after Google sign-in')
        );
        throw new Error('Failed to get user data after Google sign-in');
      }
    } catch (error) {
      logError(
        'AuthProvider',
        'signInWithGoogle - Error occurred, calling clearAuthState',
        {},
        error as Error
      );
      clearAuthState();
      throw error;
    }
  }, [setAuthenticatedState, clearAuthState, authState, isAuthenticated]);

  const signInWithApple = useCallback(async () => {
    logInfo(
      'AuthProvider',
      'signInWithApple called',
      {
        currentAuthState: authState,
        currentIsAuthenticated: isAuthenticated,
      }
    );
    
    try {
      logDebug(
        'AuthProvider',
        'signInWithApple - Setting authState to loading',
        {
          previousAuthState: authState,
          previousIsAuthenticated: isAuthenticated,
        }
      );
      setAuthState('loading');

      const isAvailable = await isAppleSignInAvailable();
      if (!isAvailable) {
        const error = new Error('Apple Sign-In is not available on this device');
        logError(
          'AuthProvider',
          'signInWithApple - Apple Sign-In not available',
          {},
          error
        );
        throw error;
      }

      const appleUser = await appleSignIn();
      if (!appleUser) {
        logWarn(
          'AuthProvider',
          'signInWithApple - No appleUser returned, calling clearAuthState',
          {}
        );
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
        logInfo(
          'AuthProvider',
          'signInWithApple - User data retrieved, calling setAuthenticatedState',
          {
            userId: userData.id,
          }
        );
        await setAuthenticatedState(userData);
      } else {
        logError(
          'AuthProvider',
          'signInWithApple - Failed to get user data after Apple sign-in',
          {},
          new Error('Failed to get user data after Apple sign-in')
        );
        throw new Error('Failed to get user data after Apple sign-in');
      }
    } catch (error) {
      logError(
        'AuthProvider',
        'signInWithApple - Error occurred, calling clearAuthState',
        {},
        error as Error
      );
      clearAuthState();
      throw error;
    }
  }, [setAuthenticatedState, clearAuthState, authState, isAuthenticated]);

  const logout = useCallback(async () => {
    logInfo(
      'AuthProvider',
      'logout called',
      {
        currentAuthState: authState,
        currentIsAuthenticated: isAuthenticated,
        userId: user?.id,
      }
    );
    
    try {
      logDebug(
        'AuthProvider',
        'logout - Setting authState to loading',
        {
          previousAuthState: authState,
          previousIsAuthenticated: isAuthenticated,
        }
      );
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
          logError(
            'AuthProvider',
            'logout - Push token removal error',
            { userId: user.id },
            error as Error
          );
        }
      }

      // Backend logout
      await authService.logout();

      // Clear all state
      logInfo(
        'AuthProvider',
        'logout - Backend logout successful, calling clearAuthState',
        {}
      );
      clearAuthState();
    } catch (error) {
      logError(
        'AuthProvider',
        'logout - Error occurred, forcing clearAuthState',
        {},
        error as Error
      );
      console.error('Logout error:', error);
      // Force clear state even if logout fails
      clearAuthState();
    }
  }, [user, clearAuthState, authState, isAuthenticated]);

  const refreshUser = useCallback(async () => {
    logDebug(
      'AuthProvider',
      'refreshUser called',
      {
        isAuthenticated,
        authState,
        userId: user?.id,
      }
    );
    
    if (!isAuthenticated) {
      logWarn(
        'AuthProvider',
        'refreshUser - Not authenticated, returning early',
        {
          isAuthenticated,
          authState,
        }
      );
      return;
    }

    try {
      const userData = await authService.getCurrentUser();
      if (userData) {
        logInfo(
          'AuthProvider',
          'refreshUser - User data retrieved, updating user',
          {
            userId: userData.id,
          }
        );
        setUser(userData);
        await initializeUserStores(userData);
      } else {
        logWarn(
          'AuthProvider',
          'refreshUser - No user data returned, calling clearAuthState',
          {}
        );
        clearAuthState();
      }
    } catch (error) {
      logError(
        'AuthProvider',
        'refreshUser - Error occurred, calling checkAuthStatus',
        {},
        error as Error
      );
      console.error('Refresh user error:', error);
      // Check if we're still authenticated
      await checkAuthStatus();
    }
  }, [isAuthenticated, initializeUserStores, clearAuthState, checkAuthStatus, authState, user]);

  // ========== Effects ==========

  // Initialize auth on mount - GUARANTEED to load tokens before UI renders
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        logInfo(
          'AuthProvider',
          'Starting authentication initialization (app mount/restart)',
          {
            currentAuthState: authState,
            currentIsAuthenticated: isAuthenticated,
            hasUser: !!user,
          }
        );
        console.log('[AUTH] Starting authentication initialization...');

        // CRITICAL: Preload tokens into memory first
        const hasTokens = await tokenManager.preloadTokens();
        logInfo(
          'AuthProvider',
          'Token preload completed',
          {
            hasTokens,
            currentAuthState: authState,
            currentIsAuthenticated: isAuthenticated,
          }
        );
        console.log('[AUTH] Token preload result:', hasTokens);

        // Now check authentication status
        logInfo(
          'AuthProvider',
          'Calling checkAuthStatus after token preload',
          {
            hasTokens,
            currentAuthState: authState,
            currentIsAuthenticated: isAuthenticated,
          }
        );
        await checkAuthStatus();

        logInfo(
          'AuthProvider',
          'Authentication initialization complete',
          {
            finalAuthState: authState,
            finalIsAuthenticated: isAuthenticated,
            hasUser: !!user,
            userId: user?.id,
          }
        );
        console.log('[AUTH] Authentication initialization complete');
      } catch (error) {
        logError(
          'AuthProvider',
          'Initialization error occurred',
          {
            currentAuthState: authState,
            currentIsAuthenticated: isAuthenticated,
          },
          error as Error
        );
        console.error('[AUTH] Initialization error:', error);
        // Even if preload fails, try auth check (might work with cached data)
        logInfo(
          'AuthProvider',
          'Retrying checkAuthStatus after initialization error',
          {}
        );
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
        if (hadTemporaryErrorRef.current || tokenManager.hasTemporarySecureStoreError()) {
          logInfo(
            'AuthProvider',
            'App became active after temporary SecureStore error - retrying authentication',
            {
              previousAppState,
              nextAppState,
              authState,
              isAuthenticated,
              hadTemporaryError: hadTemporaryErrorRef.current,
              currentTemporaryError: tokenManager.getLastSecureStoreError(),
            }
          );
          
          // Reset the flag
          hadTemporaryErrorRef.current = false;
          
          // Retry token preload and auth check
          try {
            const hasTokens = await tokenManager.preloadTokens();
            logInfo('AuthProvider', 'Token preload after app resume', {
              hasTokens,
              hasTemporaryError: tokenManager.hasTemporarySecureStoreError(),
            });
            
            if (hasTokens) {
              // Tokens loaded successfully, check auth status
              await checkAuthStatus();
            } else if (!tokenManager.hasTemporarySecureStoreError()) {
              // No tokens and no temporary error = user is logged out
              logInfo('AuthProvider', 'No tokens after app resume, user is logged out', {});
              clearAuthState();
            }
            // If there's still a temporary error, we'll try again next time
          } catch (error) {
            logError(
              'AuthProvider',
              'Error during auth retry after app resume',
              {},
              error as Error
            );
          }
        }
      }
      
      // Track if we have a temporary error when going to background
      if (nextAppState === 'background' && tokenManager.hasTemporarySecureStoreError()) {
        hadTemporaryErrorRef.current = true;
      }
      
      appStateRef.current = nextAppState;
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [checkAuthStatus, clearAuthState, authState, isAuthenticated]);

  // Set up logout callback for token refresh failures
  useEffect(() => {
    axiosClient.setOnTokenRefreshFailure(() => {
      logError(
        'AuthProvider',
        'Token refresh failed, logging out (called from axiosClient interceptor)',
        {
          currentAuthState: authState,
          currentIsAuthenticated: isAuthenticated,
          userId: user?.id,
          stackTrace: new Error().stack,
        },
        new Error('Token refresh failed')
      );
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
