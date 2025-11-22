import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
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
  const [pendingConsents, setPendingConsents] = useState<
    OutdatedConsentDTO[] | null
  >(null);
  
  // Track if initialization is in progress to prevent race conditions
  const isInitializingRef = useRef(false);

  // React Query client for cache management
  const queryClient = useQueryClient();

  // Zustand stores
  const { setUserData, updateCanSeeContent } = useUserStore();
  const { setUseFakeLocation, setFakeLocationName, setFakeLocation, setInitialized } =
    useLocationStore();

  // Save current location to backend
  const saveCurrentLocationToBackend = async (
    userId: string
  ): Promise<void> => {
    try {
      // Get current location
      const location = await getCoords();

      await userService.updateLocation(userId, location);
    } catch (error) {
      console.error('AuthProvider: Location save error:', error);
    }
  };

  // Load saved fake location place from AsyncStorage
  const loadSavedPlaceFromStorage = async (): Promise<void> => {
    try {
      const savedPlaceJson = await AsyncStorage.getItem('fakeLocationPlace');
      if (!savedPlaceJson) return;
      
      const savedPlace = JSON.parse(savedPlaceJson);
      setFakeLocation({
        latitude: savedPlace.latitude,
        longitude: savedPlace.longitude,
      });

      // Support both old placeName and new fakeLocationName for compatibility
      const name = savedPlace.fakeLocationName || savedPlace.placeName;
      if (name) {
        setFakeLocationName(name);
      }
    } catch (error) {
      console.error('AuthProvider: Error loading saved place from AsyncStorage:', error);
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
          
          // If fake location is enabled, load saved place and location from AsyncStorage
          if (appUserData.usingFakeLocation) {
            await loadSavedPlaceFromStorage();
          }
        }

        // Save current location to backend immediately after auth
        // This must happen BEFORE setInitialized to ensure location is in store
        // when useLocation hook activates
        await saveCurrentLocationToBackend(userData.id.toString());

        // Set initialized AFTER location is set so posts can be fetched
        setInitialized(true);
      }
    } catch (error) {
      console.error('AuthProvider: User data load error:', error);
    }
  };

  const initializeAuth = async () => {
    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current) {
      return;
    }
    
    try {
      isInitializingRef.current = true;
      setIsLoading(true);

      // Initialize auth service
      await authService.initialize();

      // Check if user is authenticated
      const isAuth = await authService.isAuthenticated();

      if (isAuth) {
        // Try to get cached user data first for instant UI
        let userData = await authService.getCachedUser();
        if (userData) {
          setUser(userData);
          // Set loading to false immediately after we have cached user data
          // This allows the UI to render while we load additional data in background
          setIsLoading(false);
        }

        // Then fetch fresh user data from server and load additional data in background
        userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          
          // Run these operations in parallel in the background - don't block UI
          Promise.allSettled([
            loadUserData(userData),
            pushTokenService.initialize(userData.id.toString()),
            loadConsentStatus(userData.id.toString()),
          ]).catch(error => {
            console.error('AuthProvider: Background operations error:', error);
          });
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('AuthProvider: Initialization error:', error);
      setUser(null);
    } finally {
      // Only set loading to false if we haven't already done so above
      if (isInitializingRef.current) {
        setIsLoading(false);
      }
      isInitializingRef.current = false;
    }
  };

  // Separate function for consent status loading (non-blocking)
  const loadConsentStatus = async (userId: string) => {
    try {
      const consentStatus = await consentService.getConsentStatus(userId);

      const outdated: OutdatedConsentDTO[] = consentStatus.consents
        .filter(c => !c.accepted || c.needsUpdate)
        .map(c => ({
          consentType: c.consentType,
          currentVersion: c.currentVersion,
          userAcceptedVersion: c.acceptedVersion,
          needsUpdate: c.needsUpdate,
        }));

      if (outdated.length > 0) {
        setPendingConsents(outdated);
      }
    } catch (error) {
      console.error('AuthProvider: Consent check error:', error);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);

      // Login and get tokens + consent status
      const authResponse: JwtAuthenticationResponseDTO =
        await authService.login(credentials);

      // Check if consents are required
      if (
        authResponse.consentStatus?.consentsRequired &&
        authResponse.consentStatus.outdatedConsents.length > 0
      ) {
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

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Unsubscribe from notifications
      if (globalUnsubscribeNotifications) {
        globalUnsubscribeNotifications();
      }

      // Remove push token from backend
      if (user) {
        try {
          await pushTokenService.removePushTokenFromBackend(user.id.toString());
        } catch (error) {
          console.error('AuthProvider: Push token removal error:', error);
        }
      }

      // Logout and clear tokens
      await authService.logout();
      setUser(null);

      // Clear stores
      setUserData(null);
      setUseFakeLocation(false);
      setFakeLocationName('');
      setInitialized(false);
      pushTokenService.clearToken();

      // Clear React Query cache
      queryClient.clear();
    } catch (error) {
      console.error('AuthProvider: Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, setUserData, setUseFakeLocation, setFakeLocationName, setInitialized, queryClient]);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []); // Remove logout dependency to prevent re-initialization

  // Set up logout callback for token refresh failures - separate effect
  useEffect(() => {
    axiosClient.setOnTokenRefreshFailure(() => {
      console.log('🚪 [AUTH] Token refresh failed, logging out user');
      logout();
    });
  }, [logout]);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);

      // Use React Native Google Sign-In
      const googleUser = await signInWithGoogleRN();
      if (!googleUser) {
        return;
      }

      // Call backend with Google credentials
      const authResponse: JwtAuthenticationResponseDTO =
        await socialAuthService.signInWithGoogle(
          googleUser.idToken,
          googleUser.email,
          googleUser.name,
          googleUser.photoUrl
        );

      // Check if consents are required
      if (
        authResponse.consentStatus?.consentsRequired &&
        authResponse.consentStatus.outdatedConsents.length > 0
      ) {
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
      const authResponse: JwtAuthenticationResponseDTO =
        await socialAuthService.signInWithApple(
          appleUser.idToken,
          appleUser.email,
          appleUser.name,
          appleUser.appleUserId
        );

      // Check if consents are required
      if (
        authResponse.consentStatus?.consentsRequired &&
        authResponse.consentStatus.outdatedConsents.length > 0
      ) {
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
        await loadUserData(userData);
      }
    } catch (error) {
      console.error('AuthProvider: Refresh user error:', error);
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
