import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Loading } from '../components/shared/Loading';
import AuthNav from './AuthNav';
import NotVerifiedNav from './NotVerifiedNav';
import { UserNavWrapper } from './UserNavWrapper';
import { useAppState } from '../providers/AppStateProvider';
import { PermissionsScreen } from '../screens/user/Permissions/Permissions';
import { usePermissionsContext } from '../providers/PermissionsProvider';
import { useAppInitialization } from '@/src/app/utils/hooks/useInitializationApp';
import { useAuth } from '../providers/AuthProvider';
import { useNetwork } from '../providers/NetworkProvider';
import { NetworkTopBar } from '../components/shared/NetworkTopBar';
import { OfflineScreen } from '../screens/shared/OfflineScreen';

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

  const { hasAllPermissions, checkAllPermissions } = usePermissionsContext();
  const { appState } = useAppState();
  const { isConnected, isLoading: isNetworkLoading } = useNetwork();

  // Check if email is verified
  const isEmailVerified = user?.emailVerified ?? false;

  useEffect(() => {
    switch (appState) {
      case 'active':
        checkAllPermissions();
        break;
    }
  }, [appState]);

  if (!isAppInitialized || isNetworkLoading || isAuthLoading) {
    return <Loading />;
  }

  if (!hasAllPermissions) {
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
