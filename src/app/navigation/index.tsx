import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Loading } from '../components/shared/Loading';
import AuthNav from './AuthNav';
import NotVerifiedNav from './NotVerifiedNav';
import { UserNavWrapper } from './UserNavWrapper';
import { useAppState } from '../providers/AppStateProvider';
import { PermissionsScreen } from '../screens/user/Permissions/Permissions';
import { usePermissionsContext } from '../providers/PermissionsProvider';
import { useAppInitialization } from '../utils/hooks/useInitializationApp';
import { useAuth } from '../providers/AuthProvider';
import { useNetwork } from '../providers/NetworkProvider';
import { NetworkTopBar } from '../components/shared/NetworkTopBar';
import { OfflineScreen } from '../screens/shared/OfflineScreen';
import { tokenManager } from '../utils/api/tokenManager';

// Deep linking configuration for NotVerified navigator
const notVerifiedLinking = {
  prefixes: ['https://barhubapp.com', 'https://www.barhubapp.com'],
  config: {
    screens: {
      EmailNotVerified: 'email-not-verified',
      VerifyEmail: {
        path: 'verify-email/:token',
        parse: {
          token: (token: string) => token,
        },
        stringify: {
          token: (token: string) => token,
        },
      },
      ResetPassword: {
        path: 'reset-password/:token',
        parse: {
          token: (token: string) => token,
        },
        stringify: {
          token: (token: string) => token,
        },
      },
    },
  },
};

// Deep linking configuration for Auth navigator
const authLinking = {
  prefixes: ['https://barhubapp.com', 'https://www.barhubapp.com'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: {
        path: 'reset-password/:token',
        parse: {
          token: (token: string) => token,
        },
        stringify: {
          token: (token: string) => token,
        },
      },
      VerifyEmail: {
        path: 'verify-email/:token',
        parse: {
          token: (token: string) => token,
        },
        stringify: {
          token: (token: string) => token,
        },
      },
      PostDetail: {
        path: 'post/:postId',
        parse: {
          postId: (postId: string) => postId,
        },
      },
      UserDetail: {
        path: 'user/:userId',
        parse: {
          userId: (userId: string) => userId,
        },
      },
    },
  },
};

// Deep linking configuration for main app
const mainLinking = {
  prefixes: ['https://barhubapp.com', 'https://www.barhubapp.com'],
  config: {
    screens: {
      MainTabs: {
        path: '',
        screens: {
          Feed: 'feed',
          PlaceSearch: 'search',
          Profile: 'profile',
        },
      },
      PostDetail: {
        path: 'post/:postId',
        parse: {
          postId: (postId: string) => postId,
        },
      },
      UserDetail: {
        path: 'user/:userId',
        parse: {
          userId: (userId: string) => userId,
        },
      },
      VerifyEmail: {
        path: 'verify-email/:token',
        parse: {
          token: (token: string) => token,
        },
      },
      ResetPassword: {
        path: 'reset-password/:token',
        parse: {
          token: (token: string) => token,
        },
      },
      PhotoResolver: 'photo-resolver',
      PostSummary: 'post-summary',
      NotificationsList: 'notifications',
      Info: 'info',
      AdminPanel: 'admin',
    },
  },
};

export const Navigation = () => {
  const { isAppInitialized } = useAppInitialization();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();

  const { hasAllRequiredPermissions, checkAllPermissions } = usePermissionsContext();
  const { appState } = useAppState();
  const { isConnected, isLoading: isNetworkLoading } = useNetwork();

  // Check if email is verified
  const isEmailVerified = user?.emailVerified ?? false;

  // BULLETPROOF PROTECTION: Simplified state management
  const [protectionState, setProtectionState] = React.useState<{
    hasTokensInMemory: boolean;
    hasValidRefreshToken: boolean;
    initialCheckDone: boolean;
    networkWaitDone: boolean;
  }>({
    hasTokensInMemory: false,
    hasValidRefreshToken: false,
    initialCheckDone: false,
    networkWaitDone: false,
  });
  
  // Single effect to handle all token checks
  React.useEffect(() => {
    const checkTokenStatus = async () => {
      try {
        // Check tokens in memory
        const hasTokens = tokenManager.hasTokensInMemory();
        
        // Check refresh token validity (only if no tokens in memory and not authenticated)
        let hasValidRefresh = false;
        if (!hasTokens && !isAuthenticated && !isAuthLoading) {
          try {
            const refreshToken = await tokenManager.getRefreshToken();
            hasValidRefresh = !!(refreshToken && refreshToken !== '' && 
                            !tokenManager.isTokenExpired(refreshToken));
          } catch (error) {
            hasValidRefresh = false;
          }
        }
        
        setProtectionState(prev => ({
          ...prev,
          hasTokensInMemory: hasTokens,
          hasValidRefreshToken: hasValidRefresh,
        }));
      } catch (error) {
        console.error('[Navigation] Error checking token status:', error);
      }
    };
    
    // Check immediately
    checkTokenStatus();
    
    // Set up interval only during auth loading
    let interval: NodeJS.Timeout | null = null;
    if (isAuthLoading) {
      interval = setInterval(checkTokenStatus, 100);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAuthLoading, isAuthenticated]);
  
  // Initial check timer
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setProtectionState(prev => ({ ...prev, initialCheckDone: true }));
    }, 200);
    return () => clearTimeout(timer);
  }, []);
  
  // Network wait timer for refresh token scenario
  React.useEffect(() => {
    if (protectionState.hasValidRefreshToken) {
      const timer = setTimeout(() => {
        setProtectionState(prev => ({ ...prev, networkWaitDone: true }));
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setProtectionState(prev => ({ ...prev, networkWaitDone: false }));
    }
  }, [protectionState.hasValidRefreshToken]);

  useEffect(() => {
    switch (appState) {
      case 'active':
        console.log('[Navigation] App became active, checking permissions...');
        checkAllPermissions();
        break;
    }
  }, [appState, checkAllPermissions]);

  // Always check permissions when app starts, even if none are required
  useEffect(() => {
    if (isAppInitialized && !isAuthLoading && !isNetworkLoading) {
      checkAllPermissions();
    }
  }, [isAppInitialized, isAuthLoading, isNetworkLoading]);

  // CRITICAL: Wait for all systems AND auth state to be determined
  if (!isAppInitialized || isNetworkLoading || isAuthLoading) {
    return <Loading />;
  }

  // BULLETPROOF PROTECTION: Comprehensive token-based decision logic
  
  // 1. TOKENS IN MEMORY PROTECTION: If we have tokens but auth check is not complete, wait
  if (protectionState.hasTokensInMemory && !isAuthenticated && !isAuthLoading) {
    console.log('[Navigation] Have tokens in memory but not authenticated yet, waiting...');
    return <Loading />;
  }
  
  // 2. REFRESH TOKEN PROTECTION: If we have valid refresh token but auth failed, wait for network
  if (!isAuthenticated && !isAuthLoading && 
      protectionState.hasValidRefreshToken && !protectionState.networkWaitDone) {
    console.log('[Navigation] Valid refresh token detected but auth failed - possible network issue, waiting...');
    return <Loading />;
  }
  
  // 3. INITIAL CHECK PROTECTION: Brief wait to determine token status
  if (!isAuthLoading && !isAuthenticated && 
      !protectionState.hasTokensInMemory && !protectionState.initialCheckDone) {
    return <Loading />;
  }

  // ADDITIONAL SAFETY: If user is supposed to be authenticated but we don't have user data yet, wait
  if (isAuthenticated && !user) {
    console.log('[Navigation] User authenticated but no user data yet, waiting...');
    return <Loading />;
  }

  if (!hasAllRequiredPermissions()) {
    return <PermissionsScreen />;
  }

  // Show email verification screen if authenticated but email not verified
  if (isAuthenticated && !isEmailVerified) {
    return (
      <>
        <NetworkTopBar />
        <NavigationContainer linking={notVerifiedLinking as any}>
          <NotVerifiedNav />
        </NavigationContainer>
      </>
    );
  }

  // Show offline screen if user is authenticated but has no network connection
  if (isAuthenticated && !isConnected) {
    return (
      <>
        <NetworkTopBar />
        <OfflineScreen />
      </>
    );
  }

  console.log('[Navigation] Rendering final navigation, isAuthenticated:', isAuthenticated);
  return (
    <>
      <NetworkTopBar />
      <NavigationContainer
        linking={isAuthenticated ? (mainLinking as any) : (authLinking as any)}
      >
        {isAuthenticated ? <UserNavWrapper /> : <AuthNav />}
      </NavigationContainer>
    </>
  );
};
