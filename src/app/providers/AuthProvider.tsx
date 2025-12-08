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
      console.log('🔄 [AUTH] Initialization already in progress, skipping');
      return;
    }
    
    try {
      isInitializingRef.current = true;
      setIsLoading(true);
      
      console.log('🚀 [AUTH] Starting app initialization');

      // CRITICAL: Wait for tokens to be loaded from SecureStore before checking authentication
      // This prevents race condition where isAuthenticated() runs before tokens are loaded
      console.log('⏳ [AUTH] Waiting for tokens to be loaded from SecureStore...');
      await tokenManager.waitUntilInitialized();
      console.log('✅ [AUTH] Tokens loaded, proceeding with authentication check');

      // Enhanced authentication check with better error handling
      let isAuth = false;
      let authCheckAttempts = 0;
      const maxAuthCheckAttempts = 3;

      while (authCheckAttempts < maxAuthCheckAttempts && !isAuth) {
        try {
          authCheckAttempts++;
          console.log(`🔍 [AUTH] Authentication check attempt ${authCheckAttempts}/${maxAuthCheckAttempts}`);
          
          // Pass true to allow loading tokens during app initialization
          isAuth = await authService.isAuthenticated(true);
          
          if (isAuth) {
            console.log('✅ [AUTH] User is authenticated');
            break;
          } else if (authCheckAttempts < maxAuthCheckAttempts) {
            console.log(`⏳ [AUTH] Authentication check failed, retrying in ${authCheckAttempts * 200}ms...`);
            await new Promise(resolve => setTimeout(resolve, authCheckAttempts * 200));
          }
        } catch (authError) {
          console.warn(`⚠️ [AUTH] Authentication check attempt ${authCheckAttempts} failed:`, authError);
          if (authCheckAttempts >= maxAuthCheckAttempts) {
            console.log('❌ [AUTH] All authentication check attempts failed');
            isAuth = false;
          }
        }
      }

      setIsAuthenticatedState(isAuth);
      console.log(`🎯 [AUTH] Final authentication state: ${isAuth}`);

      if (isAuth) {
        // Try to get cached user data first for instant UI
        let userData = await authService.getCachedUser();
        if (userData) {
          console.log('📱 [AUTH] Using cached user data for instant UI');
          setUser(userData);
          // Set loading to false immediately after we have cached user data
          // This allows the UI to render while we load additional data in background
          setIsLoading(false);
        }

        // Then fetch fresh user data from server with enhanced error handling
        try {
          console.log('🌐 [AUTH] Fetching fresh user data from server');
          userData = await authService.getCurrentUser();
          if (userData) {
            console.log('✅ [AUTH] Fresh user data loaded successfully');
            setUser(userData);
            
            // Run these operations in parallel in the background - don't block UI
            Promise.allSettled([
              loadUserData(userData),
              pushTokenService.initialize(userData.id.toString()),
              loadConsentStatus(userData.id.toString()),
            ]).then(results => {
              const failures = results.filter(result => result.status === 'rejected');
              if (failures.length > 0) {
                console.warn('⚠️ [AUTH] Some background initialization tasks failed:', failures);
              } else {
                console.log('✅ [AUTH] All background initialization tasks completed');
              }
            }).catch(error => {
              console.error('⚠️ [AUTH] Background operations error:', error);
            });
          } else {
            console.warn('⚠️ [AUTH] Could not fetch fresh user data, but token is still valid');
            // If userData is null but token is valid, keep isAuthenticatedState = true
            // User data will be fetched on next refresh or when needed
          }
        } catch (userDataError) {
          console.warn('⚠️ [AUTH] Failed to fetch user data, but keeping authentication state:', userDataError);
          // Don't logout if we can't fetch user data - token might still be valid
          // This prevents unnecessary logouts due to temporary network issues
        }
      } else {
        console.log('❌ [AUTH] User is not authenticated');
        setUser(null);
        setIsAuthenticatedState(false);
      }
    } catch (error) {
      console.error('❌ [AUTH] Critical initialization error:', error);
      
      // Be more conservative with error handling during initialization
      // Don't immediately assume user is not authenticated due to initialization errors
      const memoryToken = authService.getAccessToken();
      if (memoryToken) {
        console.log('🔄 [AUTH] Found token in memory despite initialization error');
        try {
          if (!tokenManager.isTokenExpired(memoryToken)) {
            console.log('✅ [AUTH] Memory token is valid, keeping authentication state');
            setIsAuthenticatedState(true);
            
            // Try to get cached user data as fallback
            const cachedUser = await authService.getCachedUser();
            if (cachedUser) {
              setUser(cachedUser);
            }
          } else {
            console.log('❌ [AUTH] Memory token is expired');
            setUser(null);
            setIsAuthenticatedState(false);
          }
        } catch (tokenCheckError) {
          console.error('❌ [AUTH] Error checking memory token:', tokenCheckError);
          setUser(null);
          setIsAuthenticatedState(false);
        }
      } else {
        setUser(null);
        setIsAuthenticatedState(false);
      }
    } finally {
      // Only set loading to false if we haven't already done so above
      if (isInitializingRef.current) {
        setIsLoading(false);
        console.log('🏁 [AUTH] Initialization completed');
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

      // Verify we have valid token (primary check)
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticatedState(isAuth);
      
      if (!isAuth) {
        throw new Error('Authentication failed after login');
      }

      // Get user data (if this fails, token is still valid - just retry later)
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);

        // Load extended user data and populate stores
        await loadUserData(userData);

        // Initialize push token service and save token to backend
        await pushTokenService.initialize(userData.id.toString());

        // Save current location to backend immediately after login
        await saveCurrentLocationToBackend(userData.id.toString());
      }
      // If userData is null, token is still valid - user data will be fetched on refresh
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

      // Verify we have valid token (primary check)
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticatedState(isAuth);
      
      if (!isAuth) {
        throw new Error('Authentication failed after registration');
      }

      // Get user data (if this fails, token is still valid - just retry later)
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);

        // Load extended user data and populate stores
        await loadUserData(userData);

        // Initialize push token service and save token to backend
        await pushTokenService.initialize(userData.id.toString());

        // Save current location to backend immediately after registration
        await saveCurrentLocationToBackend(userData.id.toString());
      }
      // If userData is null, token is still valid - user data will be fetched on refresh
    } catch (error) {
      console.error('Registration error:', error);
      setIsAuthenticatedState(false);
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

      // Verify we have valid token (primary check)
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticatedState(isAuth);
      
      if (!isAuth) {
        throw new Error('Authentication failed after registration');
      }

      // Get user data (if this fails, token is still valid - just retry later)
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);

        // Load extended user data and populate stores
        await loadUserData(userData);

        // Initialize push token service and save token to backend
        await pushTokenService.initialize(userData.id.toString());

        // Save current location to backend immediately after registration
        await saveCurrentLocationToBackend(userData.id.toString());
      }
      // If userData is null, token is still valid - user data will be fetched on refresh
    } catch (error) {
      console.error('Registration with photo error:', error);
      setIsAuthenticatedState(false);
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
      setIsAuthenticatedState(false);

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

      // Verify we have valid token (primary check)
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticatedState(isAuth);
      
      if (!isAuth) {
        throw new Error('Authentication failed after Google sign-in');
      }

      // Set user and load data (user data from response is just cache)
      if (authResponse.user) {
        setUser(authResponse.user);
        await loadUserData(authResponse.user);
        await pushTokenService.initialize(authResponse.user.id.toString());
        await saveCurrentLocationToBackend(authResponse.user.id.toString());
      } else {
        // If no user in response, fetch it (token is valid)
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          await loadUserData(userData);
          await pushTokenService.initialize(userData.id.toString());
          await saveCurrentLocationToBackend(userData.id.toString());
        }
      }
    } catch (error: any) {
      setIsAuthenticatedState(false);
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

      // Verify we have valid token (primary check)
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticatedState(isAuth);
      
      if (!isAuth) {
        throw new Error('Authentication failed after Apple sign-in');
      }

      // Set user and load data (user data from response is just cache)
      if (authResponse.user) {
        setUser(authResponse.user);
        await loadUserData(authResponse.user);
        await pushTokenService.initialize(authResponse.user.id.toString());
        await saveCurrentLocationToBackend(authResponse.user.id.toString());
      } else {
        // If no user in response, fetch it (token is valid)
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          await loadUserData(userData);
          await pushTokenService.initialize(userData.id.toString());
          await saveCurrentLocationToBackend(userData.id.toString());
        }
      }
    } catch (error: any) {
      setIsAuthenticatedState(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      // Check if still authenticated (based on token)
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticatedState(isAuth);
      
      if (!isAuth) {
        setUser(null);
        return;
      }

      // If authenticated, try to get user data (if fails, token is still valid)
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        await loadUserData(userData);
      }
      // If userData is null but token is valid, keep isAuthenticatedState = true
      // User data will be fetched on next refresh
    } catch (error) {
      console.error('AuthProvider: Refresh user error:', error);
      // On error, check if still authenticated
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticatedState(isAuth);
      if (!isAuth) {
        setUser(null);
      }
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: isAuthenticatedState, // Based on token, not just user state
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
