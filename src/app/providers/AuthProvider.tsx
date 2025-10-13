import React, {
  createContext,
  ReactNode,
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
import { signInWithApple as appleSignIn, isAppleSignInAvailable } from '../services/auth/appleSignIn';
import { consentService } from '../services/consentService';
import { OutdatedConsentDTO, JwtAuthenticationResponseDTO } from '../types/dto';

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingConsents, setPendingConsents] = useState<OutdatedConsentDTO[] | null>(null);
  
  // Temporary state for social auth flow (before consents are accepted)
  const [pendingSocialAuth, setPendingSocialAuth] = useState<{
    provider: 'google' | 'apple';
    idToken: string;
    email?: string;
    name: string;
    photoUrl?: string;
    appleUserId?: string;
  } | null>(null);
  
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // React Query client for cache management
  const queryClient = useQueryClient();

  // Zustand stores
  const { setUserData, updateCanSeeContent } = useUserStore();
  const { setUseFakeLocation, setFakeLocationName, setInitialized } =
    useLocationStore();

  // Google Sign-In hook
  // Google Sign-In is now handled directly in signInWithGoogle function

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Handle app state changes - refresh token when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        // App came to foreground from background
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // console.log('[AuthProvider] App came to foreground, checking token validity');

          // Only refresh if user is authenticated
          if (user) {
            try {
              // getValidAccessToken will automatically refresh if expired
              const token = await authService.getValidAccessToken();
              if (!token) {
                // console.log('[AuthProvider] Token refresh failed, logging out');
                await logout();
              } else {
                // console.log('[AuthProvider] Token is valid or was refreshed successfully');
              }
            } catch (error) {
              console.error(
                '[AuthProvider] Error checking token on foreground:',
                error
              );
            }
          }
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [user]);

  // Periodic token check - refresh token every 4 minutes if user is active
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(
      async () => {
        try {
          // console.log('[AuthProvider] Periodic token check');
          const token = await authService.getValidAccessToken();
          if (!token) {
            // console.log('[AuthProvider] Periodic check: Token refresh failed, logging out');
            await logout();
          }
        } catch (error) {
          console.error('[AuthProvider] Error in periodic token check:', error);
        }
      },
      4 * 60 * 1000
    ); // Check every 4 minutes

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  // Save current location to backend
  const saveCurrentLocationToBackend = async (
    userId: string
  ): Promise<void> => {
    try {
      // Get current location
      const location = await getCoords();

      // Save to backend
      await userService.updateLocation(userId, location);
    } catch (error) {
      console.error('Error saving location to backend:', error);
      // Don't throw - location saving is not critical for auth flow
    }
  };

  // Load user data and populate stores
  const loadUserData = async (userData: User): Promise<void> => {
    try {
      // Get extended user data from backend
      const appUserData = await userService.getCurrentUser();

      if (appUserData) {
        // Store complete backend DTO in new userStore
        setUserData(appUserData);

        // Update canSeeContent based on lastUploadedPostAt
        updateCanSeeContent();

        // Set fake location usage from backend
        if (appUserData.usingFakeLocation !== undefined) {
          setUseFakeLocation(appUserData.usingFakeLocation);
        }

        // Save current location to backend immediately after auth
        // This must happen BEFORE setInitialized to ensure location is in store
        // when useLocation hook activates
        await saveCurrentLocationToBackend(userData.id.toString());

        // Set initialized AFTER location is set so posts can be fetched
        setInitialized(true);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Initialize auth service
      await authService.initialize();

      // Check if user is authenticated
      const isAuth = await authService.isAuthenticated();

      if (isAuth) {
        // Try to get user data from cache first
        let userData = await authService.getCachedUser();

        if (userData) {
          setUser(userData);
        }

        // Then refresh from server
        userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          // Load extended user data and populate stores
          await loadUserData(userData);

          // Initialize push token service and save token to backend
          await pushTokenService.initialize(userData.id.toString());

          // Check consent status on app reload
          if (userData.id) {
            try {
              const consentStatus = await consentService.getConsentStatus(userData.id.toString());
              console.log('[Auth Init] Consent status on reload:', consentStatus);
              
              // Transform backend ConsentStatusDTO to OutdatedConsentDTO[]
              const outdated: OutdatedConsentDTO[] = consentStatus.consents
                .filter(c => !c.accepted || c.needsUpdate)
                .map(c => ({
                  consentType: c.consentType,
                  currentVersion: c.currentVersion,
                  userAcceptedVersion: c.acceptedVersion,
                  needsUpdate: c.needsUpdate,
                }));
              
              if (outdated.length > 0) {
                console.log('[Auth Init] Setting pending consents on reload:', outdated);
                setPendingConsents(outdated);
              }
            } catch (error) {
              console.error('Error checking consent status on reload:', error);
            }
          }
        } else {
          // If we can't get user data, logout
          await authService.logout();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // On error, clear auth state
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);

      // Login and get tokens + consent status
      const authResponse: JwtAuthenticationResponseDTO = await authService.login(credentials);

      // Check if consents are required
      if (authResponse.consentStatus?.consentsRequired && authResponse.consentStatus.outdatedConsents.length > 0) {
        // Store pending consents - modal will be shown in UserNavWrapper
        setPendingConsents(authResponse.consentStatus.outdatedConsents);
      }

      // Get user data
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        // Load extended user data and populate stores
        await loadUserData(userData);

        // Initialize push token service and save token to backend
        await pushTokenService.initialize(userData.id.toString());

        // Save current location to backend immediately after login
        await saveCurrentLocationToBackend(userData.id.toString());
      } else {
        throw new Error('Failed to get user data after login');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true);
      // Register and get tokens
      await authService.register(credentials);

      // Get user data
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        // Load extended user data and populate stores
        await loadUserData(userData);

        // Initialize push token service and save token to backend
        await pushTokenService.initialize(userData.id.toString());

        // Save current location to backend immediately after registration
        await saveCurrentLocationToBackend(userData.id.toString());
      } else {
        throw new Error('Failed to get user data after registration');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithPhoto = async (
    credentials: RegisterCredentials,
    photoUri: string
  ) => {
    try {
      setIsLoading(true);
      // Register with photo and get tokens
      await authService.registerWithPhoto(credentials, photoUri);

      // Get user data
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        // Load extended user data and populate stores
        await loadUserData(userData);

        // Initialize push token service and save token to backend
        await pushTokenService.initialize(userData.id.toString());

        // Save current location to backend immediately after registration
        await saveCurrentLocationToBackend(userData.id.toString());
      } else {
        throw new Error('Failed to get user data after registration');
      }
    } catch (error) {
      console.error('Registration with photo error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // Remove push token from backend BEFORE clearing auth tokens
      if (user) {
        try {
          await pushTokenService.removePushTokenFromBackend(user.id.toString());
        } catch (error) {
          console.error('Error removing push token from backend:', error);
          // Continue with logout even if push token removal fails
        }
      }

      // Now clear auth tokens and logout
      await authService.logout();
      setUser(null);

      // Clear all stores
      setUserData(null);
      // Reset location to default values instead of null
      setUseFakeLocation(false);
      setFakeLocationName('');
      setInitialized(false);

      // Clear push token service
      pushTokenService.clearToken();

      // Clear React Query cache to prevent stale data on next login
      queryClient.clear();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      // Use React Native Google Sign-In
      const googleUser = await signInWithGoogleRN();
      if (!googleUser) {
        return;
      }

      // Call backend with Google credentials
      const authResponse: JwtAuthenticationResponseDTO = await socialAuthService.signInWithGoogle(
        googleUser.idToken,
        googleUser.email,
        googleUser.name,
        googleUser.photoUrl
      );

      console.log('[Google Auth] Full response:', authResponse);
      console.log('[Google Auth] Consent status:', authResponse.consentStatus);

      // Check if consents are required
      if (authResponse.consentStatus?.consentsRequired && authResponse.consentStatus.outdatedConsents.length > 0) {
        console.log('[Google Auth] Setting pending consents:', authResponse.consentStatus.outdatedConsents);
        setPendingConsents(authResponse.consentStatus.outdatedConsents);
      }

      // Store tokens and user data
      await authService.handleSocialAuthResponse(authResponse);

      // Set user and load data
      if (authResponse.user) {
        setUser(authResponse.user);
        await loadUserData(authResponse.user);
        await pushTokenService.initialize(authResponse.user.id.toString());
        await saveCurrentLocationToBackend(authResponse.user.id.toString());
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithApple = async () => {
    try {
      setIsLoading(true);

      // Check if Apple Sign-In is available
      const isAvailable = await isAppleSignInAvailable();
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      // Prompt Apple Sign-In
      const appleUser = await appleSignIn();

      if (!appleUser) {
        return;
      }

      // Call backend with Apple credentials
      const authResponse: JwtAuthenticationResponseDTO = await socialAuthService.signInWithApple(
        appleUser.idToken,
        appleUser.email,
        appleUser.name,
        appleUser.appleUserId
      );

      console.log('[Apple Auth] Full response:', authResponse);
      console.log('[Apple Auth] Consent status:', authResponse.consentStatus);

      // Check if consents are required
      if (authResponse.consentStatus?.consentsRequired && authResponse.consentStatus.outdatedConsents.length > 0) {
        console.log('[Apple Auth] Setting pending consents:', authResponse.consentStatus.outdatedConsents);
        setPendingConsents(authResponse.consentStatus.outdatedConsents);
      }

      // Store tokens and user data
      await authService.handleSocialAuthResponse(authResponse);

      // Set user and load data
      if (authResponse.user) {
        setUser(authResponse.user);
        await loadUserData(authResponse.user);
        await pushTokenService.initialize(authResponse.user.id.toString());
        await saveCurrentLocationToBackend(authResponse.user.id.toString());
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        // Reload extended user data
        await loadUserData(userData);
      } else {
        // If we can't refresh user data, logout
        await logout();
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      await logout();
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
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

    if (isLoading) {
      // You can return a loading component here
      return null;
    }

    if (!isAuthenticated) {
      // You can redirect to login screen here
      return null;
    }

    return <Component {...props} />;
  };
};
