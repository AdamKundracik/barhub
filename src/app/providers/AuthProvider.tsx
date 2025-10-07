import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
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

// Types
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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

  // Zustand stores
  const { setUserData, updateCanSeeContent } = useUserStore();
  const { setUseFakeLocation, setFakeLocationName, setInitialized } =
    useLocationStore();

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Save current location to backend
  const saveCurrentLocationToBackend = async (
    userId: string
  ): Promise<void> => {
    try {
      console.log('[AuthProvider] Getting current location for user:', userId);

      // Get current location
      const location = await getCoords();
      console.log('[AuthProvider] Current location:', location);

      // Save to backend
      const success = await userService.updateLocation(userId, location);
      if (success) {
        console.log('[AuthProvider] Location saved to backend successfully');
      } else {
        console.error('[AuthProvider] Failed to save location to backend');
      }
    } catch (error) {
      console.error('[AuthProvider] Error saving location to backend:', error);
      // Don't throw - location saving is not critical for auth flow
    }
  };

  // Load user data and populate stores
  const loadUserData = async (userData: User): Promise<void> => {
    console.log('[AuthProvider] loadUserData called');
    try {
      // Get extended user data from backend
      console.log('[AuthProvider] Getting extended user data from backend');
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

        setInitialized(true);

        // Save current location to backend immediately after auth
        console.log('[AuthProvider] Saving current location to backend');
        await saveCurrentLocationToBackend(userData.id.toString());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const initializeAuth = async () => {
    console.log('[AuthProvider] initializeAuth called');
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
        console.log('[AuthProvider] Refreshing user data from server');
        userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          // Load extended user data and populate stores
          await loadUserData(userData);

          // Initialize push token service and save token to backend
          console.log(
            '[AuthProvider] Initializing push token service on app startup'
          );
          await pushTokenService.initialize(userData.id.toString());
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

      // Login and get tokens
      await authService.login(credentials);

      // Get user data
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        // Load extended user data and populate stores
        await loadUserData(userData);

        // Initialize push token service and save token to backend
        console.log(
          '[AuthProvider] Initializing push token service after login'
        );
        await pushTokenService.initialize(userData.id.toString());

        // Save current location to backend immediately after login
        console.log(
          '[AuthProvider] Saving current location to backend after login'
        );
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
        console.log(
          '[AuthProvider] Initializing push token service after registration'
        );
        await pushTokenService.initialize(userData.id.toString());

        // Save current location to backend immediately after registration
        console.log(
          '[AuthProvider] Saving current location to backend after registration'
        );
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

  const logout = async () => {
    try {
      setIsLoading(true);

      // Remove push token from backend BEFORE clearing auth tokens
      if (user) {
        console.log(
          '[AuthProvider] Removing push token from backend before logout'
        );
        try {
          await pushTokenService.removePushTokenFromBackend(user.id.toString());
        } catch (error) {
          console.error(
            '[AuthProvider] Error removing push token from backend:',
            error
          );
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
    } catch (error) {
      console.error('Logout error:', error);
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
    logout,
    refreshUser,
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
