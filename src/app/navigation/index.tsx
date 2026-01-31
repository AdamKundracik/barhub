import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Loading } from '../components/shared/Loading';
import AuthNav from './AuthNav';
import NotVerifiedNav from './NotVerifiedNav';
import { UserNavWrapper } from './UserNavWrapper';
import { useAppInitialization } from '../utils/hooks/useInitializationApp';
import { useAuth } from '../providers/AuthProvider';
import { useNetwork } from '../providers/NetworkProvider';
import { useTokenProtection } from '../utils/hooks/useTokenProtection';
import { NetworkTopBar } from '../components/shared/NetworkTopBar';
import { OfflineScreen } from '../screens/shared/OfflineScreen';
import { notVerifiedLinking, authLinking, mainLinking } from './linking';

export const Navigation = () => {
  const { isAppInitialized } = useAppInitialization();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { isConnected, isLoading: isNetworkLoading } = useNetwork();
  const { shouldShowLoading } = useTokenProtection(isAuthLoading, isAuthenticated);

  // Check if email is verified
  const isEmailVerified = user?.emailVerified ?? false;

  // CRITICAL: Wait for all systems AND auth state to be determined
  if (!isAppInitialized || isNetworkLoading || isAuthLoading) {
    return <Loading />;
  }

  // Token-based protection loading
  if (shouldShowLoading) {
    return <Loading />;
  }

  // ADDITIONAL SAFETY: If user is supposed to be authenticated but we don't have user data yet, wait
  if (isAuthenticated && !user) {
    console.log(
      '[Navigation] User authenticated but no user data yet, waiting...'
    );
    return <Loading />;
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

  // Main navigation - authenticated or auth flow
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
