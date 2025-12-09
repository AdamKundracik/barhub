import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback,
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
import { JwtAuthenticationResponseDTO, OutdatedConsentDTO } from '../types/dto';
import { axiosClient } from '../utils/api/axiosClient';
import { tokenManager } from '../utils/api/tokenManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global reference to unsubscribe function (set by Navigation component)
let globalUnsubscribeNotifications: (() => void) | null = null;

export const setGlobalUnsubscribeNotifications = (fn: (() => void) | null) => {
  globalUnsubscribeNotifications = fn;
};

// Types
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoring: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticatedState, setIsAuthenticatedState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [pendingConsents, setPendingConsents] = useState<OutdatedConsentDTO[] | null>(null);

  const queryClient = useQueryClient();
  const { setUserData, updateCanSeeContent } = useUserStore();
  const { setUseFakeLocation, setFakeLocationName, setFakeLocation, setInitialized } = useLocationStore();

  // ========== Helper Functions ==========

  const saveLocationToBackend = useCallback(async (userId: string): Promise<void> => {
    try {
      const location = await getCoords();
      await userService.updateLocation(userId, location);
    } catch (error) {
      console.error('Location save error:', error);
    }
  }, []);

  const loadFakeLocationFromStorage = useCallback(async (): Promise<void> => {
    try {
      const savedPlaceJson = await AsyncStorage.getItem('fakeLocationPlace');
      if (!savedPlaceJson) return;
      
      const savedPlace = JSON.parse(savedPlaceJson);
      setFakeLocation({
        latitude: savedPlace.latitude,
        longitude: savedPlace.longitude,
      });

      const name = savedPlace.fakeLocationName || savedPlace.placeName;
      if (name) setFakeLocationName(name);
    } catch (error) {
      console.error('Error loading fake location:', error);
    }
  }, [setFakeLocation, setFakeLocationName]);

  const initializeUserStores = useCallback(async (userData: User): Promise<void> => {
    try {
      const [appUserData] = await Promise.allSettled([
        userService.getCurrentUser(),
        saveLocationToBackend(userData.id.toString()),
      ]);

      if (appUserData.status === 'fulfilled' && appUserData.value) {
        setUserData(appUserData.value);
        updateCanSeeContent();

        if (appUserData.value.usingFakeLocation) {
          setUseFakeLocation(true);
          await loadFakeLocationFromStorage();
        }
      }

      setInitialized(true);
    } catch (error) {
      console.error('User stores initialization error:', error);
    }
  }, [setUserData, updateCanSeeContent, setUseFakeLocation, loadFakeLocationFromStorage, saveLocationToBackend, setInitialized]);

  const loadConsentStatus = useCallback(async (userId: string): Promise<void> => {
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
  }, []);

  // ========== Authentication Flow ==========

  const initializeAuth = useCallback(async () => {
    if (!isRestoring) return;

    try {
      setIsLoading(true);
      
      await tokenManager.waitUntilInitialized();
      
      // Check if we have any token first (don't set auth state yet)
      const hasToken = await tokenManager.getAccessTokenAsync(true);
      
      if (hasToken) {
        // Try to authenticate (this handles token refresh internally)
        const isAuth = await authService.isAuthenticated(true);
        
        if (isAuth) {
          setIsAuthenticatedState(true);
          
          // Try cached user first for instant UI
          let userData = await authService.getCachedUser();
          if (userData) setUser(userData);

          // Then fetch fresh data
          try {
            const freshUser = await authService.getCurrentUser();
            if (freshUser) {
              setUser(freshUser);
              userData = freshUser;
            }
          } catch (error) {
            console.error('Failed to fetch fresh user data:', error);
          }

          // Background initialization
          if (userData) {
            Promise.allSettled([
              initializeUserStores(userData),
              pushTokenService.initialize(userData.id.toString()),
              loadConsentStatus(userData.id.toString()),
            ]);
          }
        } else {
          // Only set false if authentication definitively failed after all retries
          setIsAuthenticatedState(false);
          setUser(null);
        }
      } else {
        // No token at all - definitely not authenticated
        setIsAuthenticatedState(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      
      // Fallback: check memory token before giving up
      const memoryToken = authService.getAccessToken();
      if (memoryToken && !tokenManager.isTokenExpired(memoryToken)) {
        setIsAuthenticatedState(true);
        const cachedUser = await authService.getCachedUser();
        if (cachedUser) setUser(cachedUser);
      } else {
        setUser(null);
        setIsAuthenticatedState(false);
      }
    } finally {
      setIsRestoring(false);
      setIsLoading(false);
    }
  }, [isRestoring, initializeUserStores, loadConsentStatus]);

  // Unified post-auth handler
  const handlePostAuth = useCallback(async (
    authResponse: JwtAuthenticationResponseDTO,
    userFromResponse?: User
  ): Promise<void> => {
    // Handle consents
    if (authResponse.consentStatus?.consentsRequired && 
        authResponse.consentStatus.outdatedConsents.length > 0) {
      setPendingConsents(authResponse.consentStatus.outdatedConsents);
    }

    // Verify authentication (this should succeed since we just got tokens)
    try {
      const isAuth = await authService.isAuthenticated();
      
      if (!isAuth) {
        // If verification fails after successful auth, something is wrong
        setIsAuthenticatedState(false);
        throw new Error('Authentication verification failed after successful login');
      }
      
      // Only set true after successful verification
      setIsAuthenticatedState(true);

      // Get user data
      const userData = userFromResponse || await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        await Promise.allSettled([
          initializeUserStores(userData),
          pushTokenService.initialize(userData.id.toString()),
        ]);
      }
    } catch (error) {
      setIsAuthenticatedState(false);
      throw error;
    }
  }, [initializeUserStores]);

  // ========== Auth Methods ==========

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const authResponse = await authService.login(credentials);
      await handlePostAuth(authResponse, authResponse.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handlePostAuth]);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true);
      const authResponse = await authService.register(credentials);
      await handlePostAuth(authResponse, authResponse.user);
    } catch (error) {
      console.error('Registration error:', error);
      setIsAuthenticatedState(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handlePostAuth]);

  const registerWithPhoto = useCallback(async (
    credentials: RegisterCredentials,
    photoUri: string
  ) => {
    try {
      setIsLoading(true);
      const authResponse = await authService.registerWithPhoto(credentials, photoUri);
      await handlePostAuth(authResponse, authResponse.user);
    } catch (error) {
      console.error('Registration with photo error:', error);
      setIsAuthenticatedState(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handlePostAuth]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);
      const googleUser = await signInWithGoogleRN();
      if (!googleUser) return;

      const authResponse = await socialAuthService.signInWithGoogle(
        googleUser.idToken,
        googleUser.email,
        googleUser.name,
        googleUser.photoUrl
      );

      await authService.handleSocialAuthResponse(authResponse);
      await handlePostAuth(authResponse, authResponse.user);
    } catch (error: any) {
      setIsAuthenticatedState(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handlePostAuth]);

  const signInWithApple = useCallback(async () => {
    try {
      setIsLoading(true);
      const isAvailable = await isAppleSignInAvailable();
      if (!isAvailable) throw new Error('Apple Sign-In is not available on this device');

      const appleUser = await appleSignIn();
      if (!appleUser) return;

      const authResponse = await socialAuthService.signInWithApple(
        appleUser.idToken,
        appleUser.email,
        appleUser.name,
        appleUser.appleUserId
      );

      await authService.handleSocialAuthResponse(authResponse);
      await handlePostAuth(authResponse, authResponse.user);
    } catch (error: any) {
      setIsAuthenticatedState(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handlePostAuth]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      if (globalUnsubscribeNotifications) globalUnsubscribeNotifications();

      if (user) {
        try {
          await pushTokenService.removePushTokenFromBackend(user.id.toString());
        } catch (error) {
          console.error('Push token removal error:', error);
        }
      }

      await authService.logout();
      setUser(null);
      setIsAuthenticatedState(false);
      setUserData(null);
      setUseFakeLocation(false);
      setFakeLocationName('');
      setInitialized(false);
      pushTokenService.clearToken();
      queryClient.clear();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, setUserData, setUseFakeLocation, setFakeLocationName, setInitialized, queryClient]);

  const refreshUser = useCallback(async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticatedState(isAuth);
      
      if (!isAuth) {
        setUser(null);
        return;
      }

      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        await initializeUserStores(userData);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticatedState(isAuth);
      if (!isAuth) setUser(null);
    }
  }, [initializeUserStores]);

  // ========== Effects ==========

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    axiosClient.setOnTokenRefreshFailure(logout);
  }, [logout]);

  // ========== Context Value ==========

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: isAuthenticatedState,
    isLoading,
    isRestoring,
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